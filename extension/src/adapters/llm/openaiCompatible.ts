import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import type { Usage } from "../../core/model";
import type { MentorModel } from "../../core/ports";
import { ProviderError } from "./errors";

/**
 * Adapter per OpenAI e per i server locali con API compatibile
 * (Ollama, LM Studio, llama.cpp server), tramite Chat Completions e JSON schema.
 */
export class OpenAICompatibleMentor implements MentorModel {
  private client: OpenAI;

  constructor(
    readonly provider: string,
    readonly model: string,
    opts: { apiKey?: string; baseURL?: string },
  ) {
    // I server locali non controllano la chiave, ma l'SDK ne richiede una.
    this.client = new OpenAI({ apiKey: opts.apiKey || "local", baseURL: opts.baseURL });
  }

  async generate<T>(system: string, message: string, schema: z.ZodType<T>, name: string): Promise<{ data: T; usage: Usage }> {
    try {
      const res = await this.client.chat.completions.parse({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: message },
        ],
        response_format: zodResponseFormat(schema, name),
      });
      const msg = res.choices[0]?.message;
      if (!msg) throw new ProviderError("Risposta vuota dal modello.", "other");
      if (msg.refusal) throw new ProviderError(`Il modello ha rifiutato: ${msg.refusal}`, "refusal");
      return { data: (msg.parsed as T | null) ?? parseLoosely(msg.content, schema), usage: toUsage(res.usage) };
    } catch (err) {
      throw this.toProviderError(err);
    }
  }

  async chat(system: string, message: string): Promise<{ text: string; usage: Usage }> {
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: message },
        ],
      });
      const msg = res.choices[0]?.message;
      if (msg?.refusal) throw new ProviderError(`Il modello ha rifiutato: ${msg.refusal}`, "refusal");
      return { text: (msg?.content ?? "").trim(), usage: toUsage(res.usage) };
    } catch (err) {
      throw this.toProviderError(err);
    }
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
      return ids.sort();
    } catch (err) {
      throw this.toProviderError(err);
    }
  }

  private toProviderError(err: unknown): unknown {
    if (err instanceof ProviderError) return err;
    if (err instanceof OpenAI.AuthenticationError) {
      return new ProviderError(`Chiave API di ${this.provider} mancante o non valida.`, "auth");
    }
    if (err instanceof OpenAI.RateLimitError) {
      return new ProviderError(`Troppe richieste a ${this.provider}: riprova tra poco.`, "rate");
    }
    if (err instanceof OpenAI.APIConnectionError) {
      return new ProviderError(
        this.provider === "locale"
          ? "Il server locale non risponde: è avviato (es. `ollama serve`) e l'indirizzo è corretto?"
          : `Impossibile raggiungere ${this.provider}: controlla la connessione.`,
        "network",
      );
    }
    if (err instanceof OpenAI.NotFoundError) {
      return new ProviderError(`Modello "${this.model}" non trovato su ${this.provider}.`, "config");
    }
    if (err instanceof OpenAI.APIError) {
      return new ProviderError(`Errore da ${this.provider} (${err.status}): ${err.message}`, "other");
    }
    return err;
  }
}

/** Token di una risposta: prompt_tokens comprende quelli letti dalla cache, li separiamo per stimare il costo. */
function toUsage(u: OpenAI.CompletionUsage | undefined): Usage {
  const cached = u?.prompt_tokens_details?.cached_tokens ?? 0;
  return {
    inputTokens: (u?.prompt_tokens ?? 0) - cached,
    outputTokens: u?.completion_tokens ?? 0,
    cacheReadTokens: cached,
    cacheWriteTokens: 0,
  };
}

/** Alcuni modelli locali ignorano lo schema o lo rispettano solo in parte: proviamo comunque a leggere il JSON. */
function parseLoosely<T>(content: string | null, schema: z.ZodType<T>): T {
  const json = (content ?? "").trim().match(/\{[\s\S]*\}/)?.[0];
  if (json) {
    try {
      const r = schema.safeParse(JSON.parse(json));
      if (r.success) return r.data;
    } catch {
      /* risposta non JSON: gestita sotto */
    }
  }
  throw new ProviderError(
    "Il modello non ha restituito una risposta nel formato richiesto. Con i modelli locali, prova un modello più grande.",
    "other",
  );
}
