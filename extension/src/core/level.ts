import { LEVELS, type ExperienceLevel } from "./model";

/**
 * Il livello per progetto e per linguaggio (roadmap #23): si può essere senior in TypeScript ed entry in C#.
 * Il profilo vive nello stato locale di VS Code per la cartella, non nei file del progetto: è una cosa tua, non della squadra.
 */
export interface LevelProfile {
  /** Il livello di base in questo progetto. */
  project: ExperienceLevel;
  /** Le eccezioni per linguaggio, con le chiavi di LANGUAGES ("typescript", "csharp"…). */
  byLanguage: Partial<Record<string, ExperienceLevel>>;
}

/** I linguaggi che Pebble riconosce dall'estensione del file, con il nome da mostrare. */
export const LANGUAGES: Record<string, { name: string; ext: string[] }> = {
  typescript: { name: "TypeScript", ext: ["ts", "tsx", "mts", "cts"] },
  javascript: { name: "JavaScript", ext: ["js", "jsx", "mjs", "cjs"] },
  python: { name: "Python", ext: ["py"] },
  csharp: { name: "C#", ext: ["cs"] },
  java: { name: "Java", ext: ["java"] },
  kotlin: { name: "Kotlin", ext: ["kt", "kts"] },
  swift: { name: "Swift", ext: ["swift"] },
  go: { name: "Go", ext: ["go"] },
  rust: { name: "Rust", ext: ["rs"] },
  ruby: { name: "Ruby", ext: ["rb"] },
  php: { name: "PHP", ext: ["php"] },
  c: { name: "C", ext: ["c", "h"] },
  cpp: { name: "C++", ext: ["cpp", "cc", "cxx", "hpp", "hh"] },
  dart: { name: "Dart", ext: ["dart"] },
  sql: { name: "SQL", ext: ["sql"] },
};

const BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGES).flatMap(([id, l]) => l.ext.map((e) => [e, id])),
);

/** Il linguaggio di un file dal suo percorso, o null se non è tra quelli noti. */
export function languageOfPath(path: string | null | undefined): string | null {
  const m = /\.([A-Za-z0-9]+)$/.exec(path ?? "");
  return (m && BY_EXT[m[1]!.toLowerCase()]) ?? null;
}

export const isLevel = (v: unknown): v is ExperienceLevel => (LEVELS as readonly unknown[]).includes(v);

/** Il livello per un file: quello del suo linguaggio se c'è, altrimenti quello del progetto. */
export function levelFor(profile: LevelProfile, path?: string | null): ExperienceLevel {
  const lang = languageOfPath(path);
  return (lang && profile.byLanguage[lang]) || profile.project;
}

/**
 * La riga LEVELS per il modello, solo se qualche linguaggio ha un livello diverso da quello del progetto:
 * "LEVELS: typescript=senior, csharp=entry". Una riga in più, e solo quando serve.
 */
export function levelsLine(profile: LevelProfile): string | null {
  const diff = Object.entries(profile.byLanguage).filter(([, l]) => l && l !== profile.project);
  if (!diff.length) return null;
  return `LEVELS: ${[...diff, ["other", profile.project]].map(([k, l]) => `${k}=${l}`).join(", ")}`;
}

/** Legge un profilo salvato, scartando valori non validi; senza profilo parte dal livello di base. */
export function readProfile(raw: unknown, fallback: ExperienceLevel): LevelProfile {
  const r = (raw ?? {}) as { project?: unknown; byLanguage?: Record<string, unknown> };
  const byLanguage: LevelProfile["byLanguage"] = {};
  for (const [k, v] of Object.entries(r.byLanguage ?? {})) if (LANGUAGES[k] && isLevel(v)) byLanguage[k] = v;
  return { project: isLevel(r.project) ? r.project : fallback, byLanguage };
}

/** Conta i file per linguaggio e restituisce i linguaggi del progetto, dal più presente. */
export function detectLanguages(paths: readonly string[]): string[] {
  const count = new Map<string, number>();
  for (const p of paths) {
    const l = languageOfPath(p);
    if (l) count.set(l, (count.get(l) ?? 0) + 1);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
}
