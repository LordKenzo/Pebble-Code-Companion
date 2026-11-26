import { z } from "zod";

/** Gravità di una nota, come definita nel prompt (ADR-003, prompts/mentor.md). */
export const Severity = z.enum(["errore", "avviso", "info"]);
export type Severity = z.infer<typeof Severity>;

export const Note = z.object({
  severity: Severity,
  line: z.number().int().describe("First line concerned, numbered as in the file sent"),
  endLine: z.number().int().nullable().describe("Last line concerned, or null if it is a single line"),
  anchor: z.string().describe("Where the note comes from: an ADR (e.g. ADR-002), a bootstrap section, or best practice"),
  problem: z.string(),
  why: z.string(),
  try: z.string().describe("What to try; in zone C a direction, never the code"),
});
export type Note = z.infer<typeof Note>;

export const Review = z.object({
  summary: z.string().describe("A one-line summary"),
  notes: z.array(Note).describe("At most 3 notes, ordered by impact"),
  question: z.string().nullable().describe("At most one question, or null"),
  adrProposal: z.string().nullable().describe("Title and reason of an ADR to add, or null"),
});
export type Review = z.infer<typeof Review>;

/** Il contesto di progetto che Pebble legge da disco (ADR-002). */
export interface ProjectContext {
  bootstrap: string | null;
  architecture: string | null;
  roadmap?: string | null;
  decisions: { name: string; content: string }[];
}

export interface FileUnderReview {
  path: string;
  content: string;
  languageId: string;
  /** Errori e avvisi che l'editor mostra già (compilatore, linter): i fatti più concreti sul file. */
  problems?: Problem[];
}

export interface Problem {
  /** Riga, contata da 1. */
  line: number;
  message: string;
  severity: "errore" | "avviso";
  source?: string;
}

/** Livello di esperienza dello sviluppatore: cambia cosa segnala Pebble e come lo spiega. */
export const LEVELS = ["entry", "junior", "mid", "senior"] as const;
export type ExperienceLevel = (typeof LEVELS)[number];

/** Token consumati da una richiesta. `inputTokens` esclude quelli letti o scritti in cache. */
export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** La modalità della richiesta (MODE: …), per contare la spesa per fantasmino (ADR-016). */
  mode?: string;
}

export interface ReviewResult {
  review: Review;
  /** Testi modificati dal filtro "niente codice" (ADR-003). */
  violations: number;
  provider: string;
  model: string;
  level: ExperienceLevel;
  usage: Usage;
  /** Costo stimato in dollari; null se il prezzo del modello non è noto. */
  costUsd: number | null;
}
