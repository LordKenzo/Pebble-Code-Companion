import { z } from "zod";

/** Gravità di una nota, come definita nel prompt (ADR-003, prompts/mentor.md). */
export const Severity = z.enum(["errore", "avviso", "info"]);
export type Severity = z.infer<typeof Severity>;

export const Note = z.object({
  severity: Severity,
  line: z.number().int().describe("Prima riga interessata, numerata come nel file inviato"),
  endLine: z.number().int().nullable().describe("Ultima riga interessata, o null se è una sola"),
  anchor: z.string().describe("Da dove viene la nota: un ADR (es. ADR-002), una sezione del bootstrap, oppure 'generale'"),
  problem: z.string(),
  why: z.string(),
  try: z.string().describe("Una direzione da provare, mai il codice"),
});
export type Note = z.infer<typeof Note>;

export const Review = z.object({
  summary: z.string().describe("Una riga di sintesi"),
  notes: z.array(Note).describe("Al massimo 3 note, ordinate per impatto"),
  question: z.string().nullable().describe("Al massimo una domanda, o null"),
  adrProposal: z.string().nullable().describe("Titolo e motivo di un ADR da aggiungere, o null"),
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
