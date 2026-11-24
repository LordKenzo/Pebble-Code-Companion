import { PROVIDER_TEXT, type Lang } from "../../core/i18n";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { Usage } from "../../core/model";
import type { MentorModel } from "../../core/ports";
import { ProviderError } from "./errors";

export type Effort = "low" | "medium" | "high" | "xhigh";

/** Adapter Claude (ADR-005). La chiave arriva dal SecretStorage; se manca, l'SDK usa ANTHROPIC_API_KEY o il profilo `ant`. */
export class ClaudeMentor implements MentorModel {
  readonly provider = "Claude";
  private client: Anthropic;

  constructor(readonly model: string, private effort: Effort, apiKey?: string, private lang: Lang = "it") {
    this.client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  }

  async generate<T>(system: string, message: string, schema: z.ZodType<T>, _name: string): Promise<{ data: T; usage: Usage }> {
    try {
      const res = await this.client.beta.messages.parse({
        ...this.base(system, message),
        output_config: { effort: this.effort, format: betaZodOutputFormat(schema) },
      });
      this.checkStop(res.stop_reason);
      if (res.parsed_output == null) throw new ProviderError(PROVIDER_TEXT[this.lang].unreadable, "other");
      return { data: res.parsed_output as T, usage: toUsage(res.usage) };
    } catch (err) {
      throw this.toProviderError(err);
    }
  }

  async chat(system: string, message: string): Promise<{ text: string; usage: Usage }> {
    try {
      const res = await this.client.beta.messages.create({
        ...this.base(system, message),
        output_config: { effort: this.effort },
      });
      this.checkStop(res.stop_reason);
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      return { text, usage: toUsage(res.usage) };
    } catch (err) {
      throw this.toProviderError(err);
    }
  }

  private base(system: string, message: string) {
    return {
      model: this.model,
      max_tokens: 16000,
      // Se il modello rifiuta per un falso positivo dei filtri, l'API riprova su un modello di riserva.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default" as const,
      // Il prompt di sistema è identico a ogni richiesta: lo mettiamo in cache.
      system: [{ type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } }],
      messages: [{ role: "user" as const, content: message }],
    };
  }

  private checkStop(stop: string | null): void {
    if (stop === "refusal") throw new ProviderError(PROVIDER_TEXT[this.lang].refused, "refusal");
    if (stop === "max_tokens") throw new ProviderError(PROVIDER_TEXT[this.lang].truncated, "other");
  }

  async check(): Promise<void> {
    try {
      await this.client.models.retrieve(this.model);
    } catch (err) {
      throw this.toProviderError(err);
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const ids: string[] = [];
      for await (const m of this.client.models.list()) ids.push(m.id);
      return ids;
    } catch (err) {
      throw this.toProviderError(err);
    }
  }

  private toProviderError(err: unknown): unknown {
    if (err instanceof ProviderError) return err;
    if (err instanceof Anthropic.AuthenticationError) {
      return new ProviderError(PROVIDER_TEXT[this.lang].badKey("Anthropic"), "auth");
    }
    if (err instanceof Anthropic.NotFoundError) {
      return new ProviderError(PROVIDER_TEXT[this.lang].modelNotFound(this.model, "Anthropic"), "config");
    }
    if (err instanceof Anthropic.RateLimitError) {
      return new ProviderError(PROVIDER_TEXT[this.lang].rate("Anthropic"), "rate");
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return new ProviderError(PROVIDER_TEXT[this.lang].network("Anthropic"), "network");
    }
    if (err instanceof Anthropic.APIError) {
      return new ProviderError(PROVIDER_TEXT[this.lang].other("Anthropic", err.status ?? "?", err.message), "other");
    }
    // Senza chiave l'SDK può fallire già alla creazione della richiesta.
    if (err instanceof Error && /api.?key|auth/i.test(err.message)) {
      return new ProviderError(PROVIDER_TEXT[this.lang].missingKey("Anthropic"), "auth");
    }
    return err;
  }
}

function toUsage(u: {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}): Usage {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
    cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
  };
}
