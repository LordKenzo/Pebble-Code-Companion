import type { MentorModel } from "./ports";

/**
 * Il prompt di sistema per modalità (ADR-016): il nucleo comune più la sola sezione della modalità richiesta.
 * Un'analisi del file non ha bisogno delle regole di adozione o dello scaffold: meno token a ogni chiamata,
 * e un prompt più corto che anche i modelli piccoli seguono meglio.
 */

const MODE_LINE = /^MODE: ([A-Z_]+)\s*$/m;
const MODES_HEADING = /^## Modes\s*$/m;
const MODE_HEADING = /^### MODE: ([A-Z_]+)\s*$/gm;

/** La modalità scritta nel messaggio ("MODE: ASSIST"), o null se manca. */
export function modeOf(message: string): string | null {
  return MODE_LINE.exec(message)?.[1] ?? null;
}

export interface PromptParts {
  /** Tutto quello che precede "## Modes": regole, contesto, lingua, livello. */
  core: string;
  /** Una sezione per modalità, con il suo titolo "### MODE: X". */
  modes: Record<string, string>;
  /** Quello che segue l'ultima modalità (il tono). */
  tail: string;
}

export function splitPrompt(full: string): PromptParts | null {
  const start = MODES_HEADING.exec(full);
  if (!start) return null;
  const core = full.slice(0, start.index).trimEnd();
  const rest = full.slice(start.index + start[0].length);
  const heads = [...rest.matchAll(MODE_HEADING)];
  if (!heads.length) return null;
  const modes: Record<string, string> = {};
  let tail = "";
  heads.forEach((h, i) => {
    const from = h.index ?? 0;
    const to = i + 1 < heads.length ? (heads[i + 1].index ?? rest.length) : rest.length;
    let body = rest.slice(from, to);
    if (i === heads.length - 1) {
      // dopo l'ultima modalità, il primo "## " apre la coda comune
      const next = /^## /m.exec(body.slice(h[0].length));
      if (next) {
        const cut = h[0].length + next.index;
        tail = body.slice(cut).trim();
        body = body.slice(0, cut);
      }
    }
    modes[h[1]] = body.trim();
  });
  return { core, modes, tail };
}

/**
 * Il prompt per una modalità. Senza modalità, o con una che il prompt non conosce, torna il prompt intero:
 * meglio spendere qualche token in più che togliere al modello le regole che gli servono.
 */
export function promptForMode(full: string, mode: string | null): string {
  if (!mode) return full;
  const parts = splitPrompt(full);
  const section = parts?.modes[mode];
  if (!parts || !section) return full;
  return [parts.core, "## Modes", section, parts.tail].filter(Boolean).join("\n\n") + "\n";
}

/** Chi risponde in ciascuna modalità: i fantasmini di Pebble. */
export type Ghost = "roadmap" | "mentor" | "assist" | "git";

const GHOST_OF_MODE: Record<string, Ghost> = {
  INIT: "roadmap",
  ADOPT: "roadmap",
  PLAN_STEP: "roadmap",
  SCAFFOLD: "roadmap",
  CHAT: "mentor",
  REVIEW: "mentor",
  TESTS: "mentor",
  NEW_FILE: "mentor",
  ASSIST: "assist",
  GIT_CONFLICT: "git",
  // La scala di aiuto è del Mentor (#20): nelle valutazioni un modello economico regge le schede del ⌥P, non le regole della scala.
  HELP: "mentor",
};

export function ghostOfMode(mode: string | null | undefined): Ghost | null {
  return (mode && GHOST_OF_MODE[mode]) || null;
}

/** Aggiunge la riga TRAINING: yes al messaggio quando lo sviluppatore ha scelto di allenarsi (ADR-016). */
export function withTraining(message: string, training: boolean): string {
  return training && !/^TRAINING:/m.test(message) ? `${message}\nTRAINING: yes` : message;
}

/** Aggiunge la riga LEVELS (livelli per linguaggio, roadmap #23) se c'è e se il messaggio non la porta già. */
export function withLevels(message: string, line: string | null): string {
  return line && !/^LEVELS:/m.test(message) ? `${message}\n${line}` : message;
}

/**
 * Avvolge un modello: a ogni richiesta manda solo la parte di prompt della modalità scritta nel messaggio
 * e segna quella modalità sui token restituiti; in allenamento aggiunge la riga TRAINING. Chi chiama non cambia.
 */
export function withModePrompts(inner: MentorModel, opts: { training?: boolean; levels?: string | null } = {}): MentorModel {
  const t = (message: string) => withLevels(withTraining(message, !!opts.training), opts.levels ?? null);
  return {
    provider: inner.provider,
    model: inner.model,
    async generate(system, message, schema, name) {
      const mode = modeOf(message);
      const res = await inner.generate(promptForMode(system, mode), t(message), schema, name);
      return { ...res, usage: { ...res.usage, ...(mode && { mode }) } };
    },
    async chat(system, message) {
      const mode = modeOf(message);
      const res = await inner.chat(promptForMode(system, mode), t(message));
      return { ...res, usage: { ...res.usage, ...(mode && { mode }) } };
    },
    check: () => inner.check(),
    listModels: () => inner.listModels(),
  };
}
