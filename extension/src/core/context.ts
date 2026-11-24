import { languageLine, type Lang } from "./i18n";
import type { ExperienceLevel, FileUnderReview, Problem, ProjectContext } from "./model";

/** Numera le righe come le vede l'utente nell'editor, così le note puntano alla riga giusta. */
export function numberLines(content: string): string {
  const lines = content.split(/\r?\n/);
  const width = String(lines.length).length;
  return lines.map((l, i) => `${String(i + 1).padStart(width, " ")} | ${l}`).join("\n");
}

function block(tag: string, body: string | null, attrs = ""): string {
  return body && body.trim() ? `<${tag}${attrs}>\n${body.trim()}\n</${tag}>\n` : "";
}

/** Promemoria per livello, messo accanto alla richiesta: lì il modello lo rispetta molto di più. */
export const LEVEL_HINTS: Record<ExperienceLevel, string> = {
  entry:
    "The developer is learning to program (entry). In `problem` and `why` use plain words and explain each technical term in brackets the first time (e.g. domain, adapter, transaction, ADR). In `try` write 2-3 numbered, concrete steps, without zone C code. If a choice in the file is right, say so in `summary`. To point to more reading, only the official docs of the project's stack (start page or the section to look for), never Q&A sites.",
  junior:
    "The developer is junior. In `why` name the principle at play (e.g. separation of concerns, testability) and explain it in one sentence. In `try` give a clear direction and, if useful, what to search for to learn more.",
  mid: "",
  senior:
    "The developer is senior. Only bugs, ADR violations and non-obvious trade-offs. No explanations of known concepts. About 40 words per note. In `try` you may give two alternatives with their cost, and point to a community source when it adds something the docs lack.",
};

/**
 * Costruisce il messaggio per MODE: REVIEW.
 * Il contesto stabile (bootstrap, architettura, decisioni) viene prima del file,
 * così il prefisso resta uguale tra una review e l'altra.
 */
export function buildReviewMessage(ctx: ProjectContext, file: FileUnderReview, level: ExperienceLevel = "mid", lang: Lang = "it"): string {
  const decisions = ctx.decisions.map((d) => `### ${d.name}\n${d.content.trim()}`).join("\n\n");
  const missing: string[] = [];
  if (!ctx.bootstrap) missing.push("bootstrap.md");
  if (!ctx.decisions.length) missing.push(".pebble/decisions");

  return [
    "MODE: REVIEW",
    `LEVEL: ${level}`,
    block("bootstrap", ctx.bootstrap),
    block("architecture", ctx.architecture),
    block("decisions", decisions),
    missing.length
      ? `Note: the project is missing ${missing.join(" and ")}. Anchor the notes to "general" and don't invent decisions.\n`
      : "",
    block("file", numberLines(file.content), ` path="${file.path}" language="${file.languageId}"`),
    formatProblems(file.problems),
    "The file's lines are numbered (`N | code`): use those numbers in `line` and `endLine`. Answer by filling in the requested schema.",
    LEVEL_HINTS[level],
    languageLine(lang),
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Gli errori dell'editor in un blocco <problems>: "line 3 · error · ts: Cannot find name 'describe'".
 * Vuoto se non ce ne sono. Vengono prima della logica: un file che non compila non si discute.
 */
export function formatProblems(problems: readonly Problem[] | undefined): string {
  if (!problems?.length) return "";
  const severity: Record<string, string> = { errore: "error", avviso: "warning", info: "info" };
  const lines = problems
    .slice(0, 20)
    .map((p) => `line ${p.line} · ${severity[p.severity] ?? p.severity}${p.source ? ` · ${p.source}` : ""}: ${p.message.split("\n")[0]!.trim()}`);
  return `<problems>\n${lines.join("\n")}\n</problems>`;
}
