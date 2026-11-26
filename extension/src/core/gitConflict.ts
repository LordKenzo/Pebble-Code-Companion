import { z } from "zod";
import type { ConflictBlock, GitOp } from "./git";
import { languageLine, type Lang } from "./i18n";
import type { ExperienceLevel } from "./model";

/**
 * *Spiegami il conflitto* (ADR-017): l'unica chiamata al modello del fantasmino Git.
 * Si manda solo il blocco, poche righe intorno e i due messaggi di commit: niente file intero, niente ADR.
 */
export const GitConflictAnswer = z.object({
  ours: z.string().describe("What the ours side wanted, in one or two sentences, called by its name"),
  theirs: z.string().describe("What the theirs side wanted, in one or two sentences, called by its name"),
  explanation: z.string().describe("Whether the two sides exclude each other, and what breaks if only one is kept, with concrete names or values"),
  recommendation: z.enum(["union", "ours", "theirs", "both"]).describe("What to keep"),
  union: z
    .string()
    .nullable()
    .describe("The resolved lines that replace the whole block (markers included), without conflict markers; null under training or when the recommendation is ours, theirs or both"),
  check: z.string().describe("One thing to verify after resolving: a test to run or a value to try"),
});
export type GitConflictAnswer = z.infer<typeof GitConflictAnswer>;

const CONTEXT_LINES = 6;

const norm = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");

/**
 * Un'"unione" uguale a uno dei due lati butta via l'altro senza dirlo (succede con i modelli piccoli).
 * Diventa la scelta di quel lato, senza unione, e il pannello avvisa che va controllata.
 */
export function checkUnion(a: GitConflictAnswer, block: ConflictBlock): GitConflictAnswer & { droppedSide: "ours" | "theirs" | null } {
  if (a.recommendation !== "union" || !a.union) return { ...a, droppedSide: null };
  const u = norm(a.union);
  const ours = norm(block.ours.join("\n"));
  const theirs = norm(block.theirs.join("\n"));
  if (u === ours && ours !== theirs) return { ...a, recommendation: "ours", union: null, droppedSide: "theirs" };
  if (u === theirs && ours !== theirs) return { ...a, recommendation: "theirs", union: null, droppedSide: "ours" };
  return { ...a, droppedSide: null };
}

export interface GitConflictRequest {
  level: ExperienceLevel;
  lang: Lang;
  op: GitOp | null;
  path: string;
  content: string;
  block: ConflictBlock;
  /** I due lati chiamati per nome (sideNames), con il messaggio di commit se c'è. */
  oursName: string;
  theirsName: string;
  swapped: boolean;
}

export function buildGitConflictMessage(r: GitConflictRequest): string {
  const lines = r.content.split("\n");
  const from = Math.max(0, r.block.start - 1 - CONTEXT_LINES);
  const to = Math.min(lines.length, r.block.end + CONTEXT_LINES);
  const numbered = lines
    .slice(from, to)
    .map((l, i) => `${String(from + i + 1).padStart(4, " ")} | ${l}`)
    .join("\n");
  return [
    "MODE: GIT_CONFLICT",
    `LEVEL: ${r.level}`,
    `OPERATION: ${r.op ?? "unknown"}`,
    `OURS: ${r.oursName}`,
    `THEIRS: ${r.theirsName}`,
    r.swapped ? "NOTE: this is a rebase, so the HEAD side (ours) is the branch being rebased onto, and theirs is the developer's own commit." : "",
    `<conflict path="${r.path}" lines="${r.block.start}-${r.block.end}">`,
    numbered,
    "</conflict>",
    languageLine(r.lang),
  ]
    .filter(Boolean)
    .join("\n");
}
