import type { z } from "zod";
import type { FileUnderReview, ProjectContext, Review, Usage } from "./model";

/** Un provider di modelli (ADR-005). Gli adapter in src/adapters/llm lo implementano. */
export interface MentorModel {
  readonly provider: string;
  readonly model: string;
  /** Risposta che rispetta uno schema (review, piano iniziale). */
  generate<T>(system: string, message: string, schema: z.ZodType<T>, name: string): Promise<{ data: T; usage: Usage }>;
  /** Risposta in testo libero (chat, test, prossimo passo, nuovo file). */
  chat(system: string, message: string): Promise<{ text: string; usage: Usage }>;
  /** Verifica chiave, raggiungibilità e modello senza consumare token. */
  check(): Promise<void>;
  /** Modelli disponibili per questo account o server. */
  listModels(): Promise<string[]>;
}

/** Lettura dello stato di progetto (ADR-002). */
export interface ProjectStore {
  load(): Promise<ProjectContext>;
}

export type { FileUnderReview, ProjectContext, Review };
