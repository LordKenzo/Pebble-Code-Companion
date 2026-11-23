import type { ExperienceLevel, FileUnderReview, ProjectContext } from "./model";

/** Numera le righe come le vede l'utente nell'editor, così le note puntano alla riga giusta. */
export function numberLines(content: string): string {
  const lines = content.split(/\r?\n/);
  const width = String(lines.length).length;
  return lines.map((l, i) => `${String(i + 1).padStart(width, " ")} | ${l}`).join("\n");
}

function block(tag: string, body: string | null, attrs = ""): string {
  return body && body.trim() ? `<${tag}${attrs}>\n${body.trim()}\n</${tag}>\n` : "";
}

/** Promemoria per livello, messo accanto alla richiesta: lì il modello lo rispetta molto di più. */
export const LEVEL_HINTS: Record<ExperienceLevel, string> = {
  entry:
    "Lo sviluppatore sta imparando a programmare (entry). In `problem` e `why` usa parole semplici e spiega tra parentesi ogni termine tecnico la prima volta (es. dominio, adapter, transazione, ADR). In `try` scrivi 2-3 passi numerati e concreti, senza codice. Se una scelta nel file è giusta, dillo nel `summary`.",
  junior:
    "Lo sviluppatore è junior. In `why` nomina il principio in gioco (es. separazione delle responsabilità, testabilità) e spiegalo in una frase. In `try` dai una direzione chiara e, se utile, cosa cercare per approfondire.",
  mid: "",
  senior:
    "Lo sviluppatore è senior. Solo bug, violazioni degli ADR e trade-off non ovvi. Niente spiegazioni di concetti noti. Circa 40 parole per nota. In `try` puoi indicare due alternative con il loro costo.",
};

/**
 * Costruisce il messaggio per MODE: REVIEW.
 * Il contesto stabile (bootstrap, architettura, decisioni) viene prima del file,
 * così il prefisso resta uguale tra una review e l'altra.
 */
export function buildReviewMessage(ctx: ProjectContext, file: FileUnderReview, level: ExperienceLevel = "mid"): string {
  const decisions = ctx.decisions.map((d) => `### ${d.name}\n${d.content.trim()}`).join("\n\n");
  const missing: string[] = [];
  if (!ctx.bootstrap) missing.push("bootstrap.md");
  if (!ctx.decisions.length) missing.push(".pebble/decisions");

  return [
    "MODE: REVIEW",
    `LIVELLO: ${level}`,
    block("bootstrap", ctx.bootstrap),
    block("architecture", ctx.architecture),
    block("decisions", decisions),
    missing.length
      ? `Nota: nel progetto mancano ${missing.join(" e ")}. Ancora le note a "generale" e non inventare decisioni.\n`
      : "",
    block("file", numberLines(file.content), ` path="${file.path}" language="${file.languageId}"`),
    "Le righe del file sono numerate (`N | codice`): usa quei numeri in `line` ed `endLine`. Rispondi compilando lo schema richiesto.",
    LEVEL_HINTS[level],
  ]
    .filter(Boolean)
    .join("\n");
}
