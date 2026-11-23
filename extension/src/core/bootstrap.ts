import { BOOTSTRAP_TEXT, type Lang } from "./i18n";

/**
 * Il primo sassolino: bootstrap.md composto dalle risposte della procedura guidata.
 * Logica pura, nessun modello: le parole sono dello sviluppatore, Pebble le mette in ordine
 * nel formato che MODE: INIT si aspetta, nella lingua scelta (ADR-012).
 */
export interface BootstrapAnswers {
  name: string;
  what: string;
  example: string;
  stack: string;
  rules: string;
  unknowns: string[];
  otherUnknown: string;
}

/** Dubbi frequenti all'inizio di un progetto: la procedura li propone come caselle. */
export const commonUnknowns = (lang: Lang = "it") => BOOTSTRAP_TEXT[lang].common;
/** Compatibilità: i dubbi frequenti in italiano. */
export const COMMON_UNKNOWNS = BOOTSTRAP_TEXT.it.common;
/** "Lo scrivo io": la traccia con le istruzioni nei commenti. */
export const bootstrapGuide = (lang: Lang = "it") => BOOTSTRAP_TEXT[lang].guide;
export const BOOTSTRAP_GUIDE = BOOTSTRAP_TEXT.it.guide;
/** Il dubbio aggiunto quando lo sviluppatore non sa ancora che linguaggio usare. */
export const unknownStack = (lang: Lang = "it") => BOOTSTRAP_TEXT[lang].unknownStack;

/** Divide un testo in punti: una riga per punto, togliendo trattini e righe vuote. */
const points = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

export function composeBootstrap(a: BootstrapAnswers, lang: Lang = "it"): string {
  const T = BOOTSTRAP_TEXT[lang];
  const out = [T.title(a.name.trim() || T.defaultName), "", T.what];
  out.push(a.what.trim() || T.whatMissing);
  if (a.example.trim()) out.push("", T.example, ...points(a.example).map((p) => `- ${p}`));

  out.push("", T.constraints);
  const constraints = [...(a.stack.trim() ? [a.stack.trim()] : []), ...points(a.rules)];
  out.push(...(constraints.length ? constraints.map((c) => `- ${c}`) : [T.constraintsMissing]));

  out.push("", T.unknowns);
  const unknowns = [...a.unknowns, ...points(a.otherUnknown)].filter((u, i, all) => all.indexOf(u) === i);
  out.push(...(unknowns.length ? unknowns.map((u) => `- ${u}`) : [`- ${T.unknownDefault}`]));
  return out.join("\n") + "\n";
}
