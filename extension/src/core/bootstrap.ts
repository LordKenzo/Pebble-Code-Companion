/**
 * Il primo sassolino: bootstrap.md composto dalle risposte della procedura guidata.
 * Logica pura, nessun modello: le parole sono dello sviluppatore, Pebble le mette in ordine
 * nel formato che MODE: INIT si aspetta (Cosa devo fare, Vincoli, Non so ancora).
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
export const COMMON_UNKNOWNS = [
  "Come strutturare le cartelle",
  "Che test runner usare",
  "Come gestire gli errori e i casi anomali",
  "Quali librerie servono davvero",
  "Da dove cominciare",
];

/** Divide un testo in punti: una riga per punto, togliendo trattini e righe vuote. */
const points = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

export function composeBootstrap(a: BootstrapAnswers): string {
  const name = a.name.trim() || "Il mio progetto";
  const out = [`# ${name} — bootstrap`, "", "## Cosa devo fare"];
  out.push(a.what.trim() || "_Da scrivere: cosa deve fare il progetto e per chi._");
  if (a.example.trim()) out.push("", "Esempio d'uso che immagino:", ...points(a.example).map((p) => `- ${p}`));

  out.push("", "## Vincoli");
  const constraints = [...(a.stack.trim() ? [a.stack.trim()] : []), ...points(a.rules)];
  out.push(...(constraints.length ? constraints.map((c) => `- ${c}`) : ["- _Da scrivere: linguaggio, piattaforma, regole che non si possono sbagliare._"]));

  out.push("", "## Non so ancora");
  const unknowns = [...a.unknowns, ...points(a.otherUnknown)].filter((u, i, all) => all.indexOf(u) === i);
  out.push(...(unknowns.length ? unknowns.map((u) => `- ${u}`) : ["- Da dove cominciare"]));
  return out.join("\n") + "\n";
}

/** "Lo scrivo io": la traccia con le istruzioni nei commenti, che non finiscono nel testo letto da Pebble. */
export const BOOTSTRAP_GUIDE = `# Nome del progetto — bootstrap

<!-- Scrivi con parole tue: non serve che sia perfetto. Pebble lo legge e ti propone come impostare il progetto. -->

## Cosa devo fare
<!-- Cosa deve fare il progetto e per chi, in poche righe. Se puoi, un esempio d'uso concreto. -->

## Vincoli
<!-- Linguaggio e piattaforma, librerie obbligatorie o vietate, e soprattutto le regole del dominio che non si possono sbagliare. -->
-

## Non so ancora
<!-- I dubbi: è proprio qui che Pebble ti aiuta di più. -->
- Come strutturare le cartelle
- Da dove cominciare
`;
