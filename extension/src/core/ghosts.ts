import type { Ghost } from "./prompt";

/**
 * Un modello per fantasmino (roadmap #20, ADR-016): Roadmap, Mentor e Suggeritore ⌥P possono usare modelli diversi.
 * I campi vuoti seguono il modello di default.
 */
export interface GhostModel {
  provider: string;
  model: string;
  effort: string;
}

export const GHOSTS: readonly Ghost[] = ["roadmap", "mentor", "assist"];

const PROVIDERS = ["anthropic", "openai", "local"] as const;
const EFFORTS = ["low", "medium", "high", "xhigh"] as const;

interface ModelSettings {
  provider: (typeof PROVIDERS)[number];
  anthropicModel: string;
  anthropicEffort: (typeof EFFORTS)[number];
  openaiModel: string;
  localModel: string;
}

/** Le impostazioni di default con sopra il modello del fantasmino, se ne ha uno. */
export function withGhostModel<S extends ModelSettings>(base: S, g: GhostModel): S {
  const provider = (PROVIDERS as readonly string[]).includes(g.provider) ? (g.provider as S["provider"]) : base.provider;
  const out: S = { ...base, provider };
  const model = g.model.trim();
  if (model) {
    if (provider === "anthropic") out.anthropicModel = model;
    else if (provider === "openai") out.openaiModel = model;
    else out.localModel = model;
  }
  if ((EFFORTS as readonly string[]).includes(g.effort)) out.anthropicEffort = g.effort as S["anthropicEffort"];
  return out;
}

/**
 * Il consiglio per fantasmino, dalle valutazioni del 2026-11-26 (evals/REPORT.md, "a model per ghost"):
 * Sonnet ha tenuto in tutti i casi di Roadmap e Mentor; Haiku regge le schede del ⌥P ma non la scala di aiuto
 * né il codice per un entry. I token tipici di una chiamata servono a stimarne il costo.
 */
export interface GhostAdvice {
  tier: "strong" | "mid" | "cheap";
  effort: (typeof EFFORTS)[number];
  /** Un modello Claude che nelle valutazioni ha tenuto. */
  claude: string;
  /** Token tipici di una chiamata (medie delle valutazioni). */
  typical: { input: number; output: number };
}

export const GHOST_ADVICE: Record<Ghost, GhostAdvice> = {
  roadmap: { tier: "strong", effort: "high", claude: "claude-sonnet-5-5", typical: { input: 8_000, output: 2_600 } },
  mentor: { tier: "mid", effort: "medium", claude: "claude-sonnet-5-5", typical: { input: 7_000, output: 1_300 } },
  assist: { tier: "cheap", effort: "low", claude: "claude-haiku-5-5", typical: { input: 8_500, output: 1_300 } },
};
