import { EXT_TEXT, type Lang } from "./i18n";
import type { Usage } from "./model";

/** Prezzi in dollari per milione di token. */
export interface Price {
  input: number;
  output: number;
  /** Lettura dalla cache; se manca si usa `input`. */
  cacheRead?: number;
  /** Scrittura in cache; se manca si usa `input`. */
  cacheWrite?: number;
}

/**
 * Prezzi di listino noti al 2026-11 (API Anthropic). Sono una stima: la fattura vera è nella console del provider.
 * La scrittura in cache (TTL 5 minuti) costa 1,25 volte l'input.
 * Per OpenAI e altri modelli si configurano in `pebble.prices`.
 */
export const DEFAULT_PRICES: Record<string, Price> = {
  "claude-fable-5-2": { input: 8, output: 40, cacheRead: 0.2, cacheWrite: 10 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

export function resolvePrice(
  model: string,
  isLocal: boolean,
  overrides: Record<string, Price> = {},
): Price | undefined {
  if (isLocal) return { input: 0, output: 0 };
  return overrides[model] ?? DEFAULT_PRICES[model];
}

export function estimateCost(usage: Usage, price: Price | undefined): number | null {
  if (!price) return null;
  const perToken = (perMillion: number) => perMillion / 1_000_000;
  return (
    usage.inputTokens * perToken(price.input) +
    usage.outputTokens * perToken(price.output) +
    usage.cacheReadTokens * perToken(price.cacheRead ?? price.input) +
    usage.cacheWriteTokens * perToken(price.cacheWrite ?? price.input)
  );
}

/** Formatta un costo piccolo in modo leggibile: $0.0123, $1.24. */
export function formatUsd(v: number | null, lang: Lang = "it"): string {
  if (v === null) return EXT_TEXT[lang].noPrice;
  if (v === 0) return "$0";
  return v < 0.1 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
}
