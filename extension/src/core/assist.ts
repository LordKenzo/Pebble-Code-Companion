import { z } from "zod";
import { formatProblems, numberLines } from "./context";
import { languageLine, type Lang } from "./i18n";
import type { ExperienceLevel, Problem, ProjectContext } from "./model";
import { projectBlocks } from "./modes";

/**
 * ⌥P ripensato (ADR-015): cosa selezioni decide che aiuto ricevi, in un pannello accanto al codice.
 * Ogni scheda è una richiesta MODE: ASSIST con la sua risposta strutturata; la scala di aiuto resta MODE: HELP.
 */
/** "review" è la review vera (MODE: REVIEW), mostrata nel pannello: una sola strada per "com'è questo file?". */
export type FileAsk = "review" | "study" | "pseudo";
export type SelectionAsk = "explain" | "study" | "similar";
export type AssistAsk = FileAsk | SelectionAsk;
/** Le schede che chiedono MODE: ASSIST al modello. */
export type ModelAsk = Exclude<AssistAsk, "review">;

export const Study = z.object({
  items: z
    .array(
      z.object({
        title: z.string().describe("The concept, named so it can be searched"),
        body: z.string().describe("Why it matters in this file, 1-2 sentences"),
        source: z.string().describe("Where to study it, suited to the level (see the prompt's sources by level); no invented URLs"),
      }),
    )
    .describe("2 or 3 concepts"),
});

export const Pseudo = z.object({
  intro: z.string().describe("One sentence: what is missing and where"),
  target: z.string().nullable().describe("The name of the empty or unfinished function the steps are for, or null"),
  steps: z.array(z.string()).describe("3 to 7 pseudocode steps in words, with the project's names; each one short line (about 12 words), since they become comments in the code; never code"),
  question: z.string().nullable().describe("One thing to work out by hand before writing, or null"),
});

export const Explain = z.object({
  lines: z
    .array(z.object({ where: z.string().describe("'line 12' or 'lines 12-13'"), text: z.string().describe("What that line does and why") }))
    .describe("Line by line over the selection, grouping lines that belong together"),
  summary: z.string().describe("The idea in one or two sentences, with real values traced through it when they help"),
});

export const Similar = z.object({
  examples: z
    .array(
      z.object({
        title: z.string().describe("The analogous case, in a different domain"),
        setup: z.string().describe("The starting values"),
        trace: z.string().describe("The steps with their values, one per line; prose and numbers, not code"),
      }),
    )
    .describe("2 examples, different from the developer's case"),
});

export type Study = z.infer<typeof Study>;
export type Pseudo = z.infer<typeof Pseudo>;
export type Explain = z.infer<typeof Explain>;
export type Similar = z.infer<typeof Similar>;

export const ASSIST_SCHEMAS = { study: Study, pseudo: Pseudo, explain: Explain, similar: Similar } as const;

export interface AssistRequest {
  ctx: ProjectContext;
  level: ExperienceLevel;
  file: { path: string; content: string };
  ask: ModelAsk;
  /** Righe selezionate, contate da 1; assente = il file intero. */
  selection?: { from: number; to: number } | null;
  /** Test rossi del compito, se ci sono: danno concretezza ai suggerimenti. */
  red?: string[];
  problems?: Problem[];
  lang?: Lang;
}

const LEVEL_DEPTH: Record<ExperienceLevel, string> = {
  entry: "Entry level: take almost nothing for granted. Explain every term in brackets the first time, trace real values step by step, end with a small thing to try by hand. Sources: official docs only.",
  junior: "Junior level: explain the why and name the principle; trace values where they help.",
  mid: "",
  senior: "Senior level: terse. Skip known concepts; give costs, risks and alternatives. Community sources are fine.",
};

const block = (tag: string, body: string | null | undefined, attrs = "") => (body && body.trim() ? `<${tag}${attrs}>\n${body.trim()}\n</${tag}>` : "");

export function buildAssistMessage(r: AssistRequest): string {
  const sel = r.selection ? `<selection lines="${r.selection.from}-${r.selection.to}">` : "<selection>none: the whole file</selection>";
  return [
    "MODE: ASSIST",
    `LEVEL: ${r.level}`,
    `ASK: ${r.ask}`,
    projectBlocks(r.ctx),
    block("file", numberLines(r.file.content), ` path="${r.file.path}"`),
    sel,
    formatProblems(r.problems),
    r.red?.length ? block("tests", r.red.map((n) => `✖ ${n}`).join("\n")) : "",
    "Answer by filling in the schema.",
    LEVEL_DEPTH[r.level],
    languageLine(r.lang ?? "it"),
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Inserisce i passi di pseudocodice come commenti nella funzione indicata, subito dopo la sua apertura.
 * Restituisce null se la funzione non si trova: in quel caso il pannello offre di copiarli.
 */
export function insertPseudocode(source: string, target: string, steps: readonly string[], todo = "TODO(you)"): string | null {
  const lines = source.split("\n");
  const name = target.replace(/[^\w$]/g, "");
  if (!name) return null;
  const head = new RegExp(`\\b(function\\s+${name}\\b|${name}\\s*[=:]\\s*(async\\s*)?(function\\b|\\([^)]*\\)\\s*(:[^=]+)?=>)|def\\s+${name}\\b)`);
  const at = lines.findIndex((l) => head.test(l));
  if (at === -1) return null;
  // La riga che apre il corpo: quella con "{" o, in Python, quella che finisce con ":".
  let open = at;
  while (open < lines.length && !/[{:]\s*$/.test(lines[open]!)) open++;
  if (open >= lines.length) return null;
  const python = /:\s*$/.test(lines[open]!) && !/\{\s*$/.test(lines[open]!);
  const indent = (lines[at]!.match(/^\s*/)?.[0] ?? "") + (python ? "    " : "  ");
  const c = python ? "#" : "//";
  const comment = [`${indent}${c} ${todo}`, ...steps.map((s, i) => `${indent}${c} ${i + 1}. ${s.replace(/^\s*\d+[.)]\s*/, "")}`)];
  lines.splice(open + 1, 0, ...comment);
  return lines.join("\n");
}
