import { PROVIDER_TEXT, type Lang } from "../../core/i18n";
import type { MentorModel } from "../../core/ports";
import { ClaudeMentor, type Effort } from "./claude";
import { ProviderError } from "./errors";
import { OpenAICompatibleMentor } from "./openaiCompatible";
import { withModePrompts } from "../../core/prompt";

export type ProviderId = "anthropic" | "openai" | "local";

export interface ProviderSettings {
  provider: ProviderId;
  anthropicModel: string;
  anthropicEffort: Effort;
  openaiModel: string;
  localBaseUrl: string;
  localModel: string;
  /** Lingua dei messaggi d'errore (ADR-012). */
  lang?: Lang;
}

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  anthropic: "Claude",
  openai: "OpenAI",
  local: "locale",
};

/** Sceglie l'adapter in base alle impostazioni (ADR-005). */
export function createMentor(s: ProviderSettings, apiKey: string | undefined): MentorModel {
  return withModePrompts(createProviderMentor(s, apiKey));
}

function createProviderMentor(s: ProviderSettings, apiKey: string | undefined): MentorModel {
  switch (s.provider) {
    case "anthropic":
      return new ClaudeMentor(s.anthropicModel, s.anthropicEffort, apiKey, s.lang);
    case "openai":
      if (!s.openaiModel) throw new ProviderError(PROVIDER_TEXT[s.lang ?? "it"].setOpenaiModel, "config");
      if (!apiKey) throw new ProviderError(PROVIDER_TEXT[s.lang ?? "it"].missingKey("OpenAI"), "auth");
      return new OpenAICompatibleMentor("OpenAI", s.openaiModel, { apiKey, ...(s.lang && { lang: s.lang }) });
    case "local":
      if (!s.localModel) {
        throw new ProviderError(PROVIDER_TEXT[s.lang ?? "it"].setLocalModel, "config");
      }
      return new OpenAICompatibleMentor("locale", s.localModel, { baseURL: s.localBaseUrl, apiKey, ...(s.lang && { lang: s.lang }) });
  }
}
