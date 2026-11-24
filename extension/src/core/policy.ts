import { EXT_TEXT, type Lang } from "./i18n";
import type { Review } from "./model";

export const MAX_CODE_LINES = 3;

/** Zona A del prompt: configurazione e comandi, che Pebble può dare completi. */
const CONFIG_LANGS = new Set([
  "json", "jsonc", "json5", "yaml", "yml", "toml", "ini", "env", "properties",
  "dockerfile", "gitignore", "ignore", "editorconfig",
]);
const SHELL_LANGS = new Set(["sh", "bash", "zsh", "shell", "console", "terminal", "powershell", "ps1"]);
/** Blocchi senza linguaggio o di testo: passano se sono un albero di cartelle, non se sembrano codice. */
const PLAIN_LANGS = new Set(["", "text", "txt", "tree", "plaintext"]);
const LOOKS_LIKE_CODE = /[;{}]\s*$|=>|\bfunction\b|\breturn\b|\bconst\b|\blet\b|\bimport\b|\bdef\b|\bclass\b/;
/** Un comando che scrive o esegue codice inline è logica travestita da shell. */
const SHELL_SMUGGLING = /<<|\b(node|python3?|deno|bun|ruby|perl)\s+(-e|-c|--eval)\b/;

/** Zona B: un blocco di sole dichiarazioni (firme, tipi, scheletro di classe) può arrivare a queste righe. */
export const MAX_SIGNATURE_LINES = 20;
const DECL_LANGS = new Set(["ts", "typescript", "tsx", "mts", "cts"]);
/** Segni di un corpo o di un'istruzione: se una riga ne contiene uno, il blocco non è solo dichiarazioni. */
const STATEMENT = [
  /\breturn\b/, /\b(if|for|while|switch|catch)\s*\(/, /\b(await|throw|yield)\b/, /\bnew\s+[A-Za-z_]/, /\bconsole\./,
  /(?<!\bdeclare\s)\b(const|let|var)\s+[\w{[]/, /=>\s*\{/, /\)\s*(:\s*[^=;]+)?\{\s*[^}\s]/, /\)\s*(:\s*[^=;]+)?\{\s*$/,
  /^\s*(?:(?:private|public|protected|readonly|static)\s+)*[\w.]+\s*=(?![=>])/,
];

/** true se il blocco TypeScript contiene solo dichiarazioni, senza corpi né istruzioni. */
export function isSignatureOnly(lang: string, body: string): boolean {
  const l = lang.trim().toLowerCase().split(/\s+/)[0] ?? "";
  if (!DECL_LANGS.has(l)) return false;
  const lines = body.split("\n").map((line) => line.replace(/\/\/.*$/, "")).filter((line) => line.trim());
  return lines.length <= MAX_SIGNATURE_LINES && !lines.some((line) => STATEMENT.some((re) => re.test(line)));
}

/** true se il blocco è contenuto di zona A, un albero o sole dichiarazioni (zona B) e quindi non va limitato. */
export function isAllowedLongBlock(lang: string, body: string): boolean {
  const l = lang.trim().toLowerCase().split(/\s+/)[0] ?? "";
  if (CONFIG_LANGS.has(l)) return true;
  if (isSignatureOnly(lang, body)) return true;
  if (SHELL_LANGS.has(l)) return !SHELL_SMUGGLING.test(body);
  if (PLAIN_LANGS.has(l)) return !body.split("\n").some((line) => LOOKS_LIKE_CODE.test(line));
  return false;
}

/**
 * Secondo livello del vincolo "niente codice" (ADR-003), allineato alle zone del prompt v0.4.
 * Rimuove i blocchi ``` con più di MAX_CODE_LINES righe non vuote, tranne configurazione,
 * comandi da terminale, alberi di cartelle e blocchi di sole dichiarazioni (fino a MAX_SIGNATURE_LINES).
 */
export function stripLongCode(text: string, lang: Lang = "it"): { text: string; removed: number } {
  const NOTICE = EXT_TEXT[lang].codeRemoved;
  let removed = 0;
  const out = text.replace(/```([^\n]*)\n([\s\S]*?)```/g, (whole, lang: string, body: string) => {
    const lines = body.split("\n").filter((l) => l.trim()).length;
    if (lines <= MAX_CODE_LINES || isAllowedLongBlock(lang, body)) return whole;
    removed++;
    return NOTICE;
  });
  return { text: out, removed };
}

/** Applica il filtro a tutti i testi della review e la limita a 3 note. */
export function applyPolicy(review: Review, lang: Lang = "it"): { review: Review; violations: number } {
  let violations = 0;
  const clean = (s: string) => {
    const r = stripLongCode(s, lang);
    violations += r.removed;
    return r.text;
  };
  const cleanOrNull = (s: string | null) => (s === null ? null : clean(s));

  const notes = review.notes.slice(0, 3).map((n) => ({
    ...n,
    problem: clean(n.problem),
    why: clean(n.why),
    try: clean(n.try),
  }));
  return {
    review: {
      summary: clean(review.summary),
      notes,
      question: cleanOrNull(review.question),
      adrProposal: cleanOrNull(review.adrProposal),
    },
    violations,
  };
}
