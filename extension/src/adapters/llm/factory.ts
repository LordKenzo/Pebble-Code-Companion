import type { MentorModel } from "../../core/ports";
import { ClaudeMentor, type Effort } from "./claude";
import { ProviderError } from "./errors";
import { OpenAICompatibleMentor } from "./openaiCompatible";

export type ProviderId = "anthropic" | "openai" | "local";

export interface ProviderSettings {
  provider: ProviderId;
  anthropicModel: string;
  anthropicEffort: Effort;
  openaiModel: string;
  localBaseUrl: string;
  localModel: string;
}

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  anthropic: "Claude",
  openai: "OpenAI",
  local: "locale",
};

/** Sceglie l'adapter in base alle impostazioni (ADR-005). */
export function createMentor(s: ProviderSettings, apiKey: string | undefined): MentorModel {
  switch (s.provider) {
    case "anthropic":
      return new ClaudeMentor(s.anthropicModel, s.anthropicEffort, apiKey);
    case "openai":
      if (!s.openaiModel) throw new ProviderError("Imposta il modello OpenAI in pebble.openai.model.", "config");
      if (!apiKey) throw new ProviderError("Chiave API di OpenAI mancante.", "auth");
      return new OpenAICompatibleMentor("OpenAI", s.openaiModel, { apiKey });
    case "local":
      if (!s.localModel) {
        throw new ProviderError("Imposta il modello locale in pebble.local.model (es. il nome che vedi con `ollama list`).", "config");
      }
      return new OpenAICompatibleMentor("locale", s.localModel, { baseURL: s.localBaseUrl, apiKey });
  }
}
