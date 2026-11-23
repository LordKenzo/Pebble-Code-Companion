import { z } from "zod";
import { LEVEL_HINTS, numberLines } from "./context";
import type { ExperienceLevel, ProjectContext } from "./model";

// ---------- MODE: INIT (risposta strutturata, per poterla salvare in .pebble/) ----------

export const Decision = z.object({
  title: z.string().describe("Titolo breve della decisione, senza numero (niente 'ADR-001:')"),
  context: z.string().describe("Perché serve decidere"),
  decision: z.string().describe("Cosa si fa"),
  alternatives: z.string().describe("Alternative scartate e perché"),
  consequences: z.string().describe("Cosa diventa più facile e cosa più difficile"),
});

export const InitPlan = z.object({
  reading: z.string().describe("2-3 righe: cosa hai capito del bootstrap"),
  blockingQuestion: z
    .string()
    .nullable()
    .describe("Se manca un'informazione essenziale per decidere: la domanda, e lascia vuoti gli altri campi. Altrimenti null"),
  decisions: z.array(Decision).describe("Da 3 a 5 decisioni; rispondono ai punti di 'Non so ancora'"),
  layers: z.string().describe("Livelli e dipendenze tra loro, in Markdown"),
  folders: z.string().describe("Albero delle cartelle con una riga di descrizione per voce, senza file di codice"),
  roadmap: z.array(z.string()).describe("Da 5 a 8 passi verificabili; il primo piccolo e fattibile in una sessione"),
  start: z.string().describe("Un solo file o attività da cui partire, con il motivo"),
  question: z.string().nullable().describe("Al massimo una domanda che cambia il lavoro, o null"),
});
export type InitPlan = z.infer<typeof InitPlan>;

function block(tag: string, body: string | null | undefined, attrs = ""): string {
  return body && body.trim() ? `<${tag}${attrs}>\n${body.trim()}\n</${tag}>\n` : "";
}

export function projectBlocks(ctx: ProjectContext): string {
  const decisions = ctx.decisions.map((d) => `### ${d.name}\n${d.content.trim()}`).join("\n\n");
  return [block("bootstrap", ctx.bootstrap), block("architecture", ctx.architecture), block("decisions", decisions), block("roadmap", ctx.roadmap)]
    .filter(Boolean)
    .join("\n");
}

export function buildInitMessage(bootstrap: string, level: ExperienceLevel): string {
  return [
    "MODE: INIT",
    `LIVELLO: ${level}`,
    block("bootstrap", bootstrap),
    "Rispondi compilando lo schema richiesto. Testo in Markdown semplice, nessun blocco di codice tranne l'albero delle cartelle.",
    LEVEL_HINTS[level],
  ]
    .filter(Boolean)
    .join("\n");
}

const pad = (n: number) => String(n).padStart(3, "0");
/** I modelli a volte numerano già il titolo ("ADR-003: …"): la numerazione la fa Pebble. */
export const cleanTitle = (s: string) => s.replace(/^\s*\**\s*ADR[-\s]?\d+\s*[:·.\-–—]?\s*/i, "").trim();
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/, "");

/** Il piano mostrato nella chat. */
export function initPlanToMarkdown(p: InitPlan): string {
  if (p.blockingQuestion) return `${p.reading}\n\n**Prima di proporti un piano mi serve una risposta:** ${p.blockingQuestion}`;
  const adrs = p.decisions
    .map((d, i) => `**ADR-${pad(i + 1)} · ${cleanTitle(d.title)}**\n${d.decision}\n*Scartato:* ${d.alternatives}`)
    .join("\n\n");
  return [
    p.reading,
    `### Decisioni proposte\n${adrs}`,
    `### Architettura\n${p.layers}\n\n\`\`\`\n${p.folders.replace(/^```\w*\n?|```$/g, "").trim()}\n\`\`\``,
    `### Roadmap\n${p.roadmap.map((s, i) => `${i + 1}. ${s.replace(/^\s*\d+[.)]\s*/, "")}`).join("\n")}`,
    `### Da dove partire\n${p.start}`,
    p.question ? `**Domanda:** ${p.question}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** I file da scrivere in .pebble/ (ADR-002), con percorsi relativi alla radice del progetto. */
export function initPlanToFiles(p: InitPlan, date: string): { path: string; content: string }[] {
  const header = `> Generato da Pebble (MODE: INIT) dal bootstrap del ${date}. Stato: proposto. Modificalo pure: Pebble rispetta quello che c'è scritto qui.\n`;
  const files = [
    {
      path: ".pebble/architecture.md",
      content: `# Architettura\n\n${header}\n## Lettura del bootstrap\n\n${p.reading}\n\n## Livelli\n\n${p.layers}\n\n## Cartelle\n\n\`\`\`\n${p.folders
        .replace(/^```\w*\n?|```$/g, "")
        .trim()}\n\`\`\`\n`,
    },
    {
      path: ".pebble/roadmap.md",
      content: `# Roadmap\n\n${header}\n${p.roadmap.map((s, i) => `${i + 1}. ${s.replace(/^\s*\d+[.)]\s*/, "")}`).join("\n")}\n\n## Da dove partire\n\n${p.start}\n${
        p.question ? `\n## Domanda aperta\n\n${p.question}\n` : ""
      }`,
    },
  ];
  p.decisions.forEach((d, i) => {
    const id = `ADR-${pad(i + 1)}`;
    const title = cleanTitle(d.title);
    files.push({
      path: `.pebble/decisions/${id}-${slug(title)}.md`,
      content: `## ${id}: ${title}\nStato: proposto\nContesto: ${d.context}\nDecisione: ${d.decision}\nAlternative scartate: ${d.alternatives}\nConseguenze: ${d.consequences}\n`,
    });
  });
  return files;
}

// ---------- Modalità in testo libero ----------

export type TextMode = "CHAT" | "NEXT" | "TESTS" | "NEW_FILE";

export interface OpenFile {
  path: string;
  content: string;
}

export interface Turn {
  role: "user" | "pebble";
  text: string;
}

const FORMAT_HINT =
  "Rispondi compilando lo schema. In `answer` usa Markdown, breve, da leggere mentre si lavora; niente codice oltre firme o frammenti di 3 righe. " +
  "In `decisionChanges` proponi la modifica di un ADR esistente o un ADR nuovo solo se lo sviluppatore ha espresso una scelta che cambia una decisione, " +
  "o se una decisione è chiaramente superata; altrimenti lascia la lista vuota. In `content` scrivi l'ADR completo nel formato del progetto " +
  "(## ADR-NNN: titolo, Stato, Contesto, Decisione, Alternative scartate, Conseguenze).";

export const DecisionChange = z.object({
  target: z.string().nullable().describe("ADR da modificare, es. 'ADR-005'; null per un ADR nuovo"),
  title: z.string().describe("Titolo della decisione, senza numero"),
  reason: z.string().describe("Una frase: perché cambiarla o aggiungerla"),
  content: z.string().describe("Testo completo dell'ADR aggiornato o nuovo, in Markdown"),
});
export type DecisionChange = z.infer<typeof DecisionChange>;

export const TextAnswer = z.object({
  answer: z.string().describe("La risposta per lo sviluppatore, in Markdown"),
  decisionChanges: z.array(DecisionChange).describe("Modifiche proposte alle decisioni; di solito vuota"),
});
export type TextAnswer = z.infer<typeof TextAnswer>;

/**
 * Dove e con che testo scrivere una modifica a una decisione (ADR-002).
 * Un ADR esistente mantiene il suo file; uno nuovo prende il numero successivo.
 */
export function decisionFile(change: DecisionChange, existing: { name: string }[]): { id: string; path: string; content: string; isNew: boolean } {
  const num = (s: string | null | undefined) => Number(s?.match(/ADR[-\s]?(\d+)/i)?.[1] ?? NaN);
  const wanted = num(change.target);
  const found = Number.isNaN(wanted) ? undefined : existing.find((d) => num(d.name) === wanted);
  const max = existing.reduce((m, d) => Math.max(m, num(d.name) || 0), 0);
  const id = `ADR-${pad(found ? wanted : max + 1)}`;
  const title = cleanTitle(change.title);
  const path = found ? `.pebble/decisions/${found.name}.md` : `.pebble/decisions/${id}-${slug(title)}.md`;

  // Se il modello ha scritto l'intestazione, la prima riga è il titolo; altrimenti lo aggiungiamo noi.
  const raw = change.content.trim();
  const hasHeading = /^#+\s/.test(raw);
  const body = hasHeading ? cleanTitle(raw.replace(/^#+\s*/, "")) : `${title}\n${raw}`;
  return { id, path, content: `## ${id}: ${body}\n`, isNew: !found };
}

/** Messaggio per CHAT, NEXT, TESTS, NEW_FILE: contesto di progetto, file aperto, conversazione recente. */
export function buildTextMessage(
  mode: TextMode,
  ctx: ProjectContext,
  level: ExperienceLevel,
  opts: { file?: OpenFile; question?: string; history?: Turn[] } = {},
): string {
  const history = (opts.history ?? [])
    .slice(-8)
    .map((t) => `${t.role === "user" ? "Sviluppatore" : "Pebble"}: ${t.text.slice(0, 1500)}`)
    .join("\n\n");
  const fileAttr = opts.file ? ` path="${opts.file.path}"` : "";
  return [
    `MODE: ${mode}`,
    `LIVELLO: ${level}`,
    projectBlocks(ctx),
    opts.file ? block("file", mode === "NEW_FILE" ? opts.file.content || "(vuoto)" : numberLines(opts.file.content), fileAttr) : "",
    history ? block("conversazione", history) : "",
    opts.question ? `Domanda dello sviluppatore:\n${opts.question}` : "",
    FORMAT_HINT,
    LEVEL_HINTS[level],
  ]
    .filter(Boolean)
    .join("\n");
}
