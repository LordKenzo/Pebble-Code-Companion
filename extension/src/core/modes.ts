import { INIT_TEXT, languageLine, type Lang } from "./i18n";
import { z } from "zod";
import { formatProblems, LEVEL_HINTS, numberLines } from "./context";
import type { ExperienceLevel, Problem, ProjectContext } from "./model";

// ---------- MODE: INIT (risposta strutturata, per poterla salvare in .pebble/) ----------

export const Decision = z.object({
  title: z.string().describe("Short title of the decision, without a number (no 'ADR-001:')"),
  context: z.string().describe("Why a decision is needed"),
  decision: z.string().describe("What we do"),
  alternatives: z.string().describe("Alternatives ruled out and why"),
  consequences: z.string().describe("What becomes easier and what becomes harder"),
});

export const InitPlan = z.object({
  reading: z.string().describe("2-3 lines: what you understood of the bootstrap"),
  blockingQuestion: z
    .string()
    .nullable()
    .describe("If essential information to decide is missing: the question, leaving the other fields empty. Otherwise null"),
  decisions: z.array(Decision).describe("3 to 5 decisions; they answer the points under 'What I don't know yet'"),
  layers: z.string().describe("Layers and the dependencies between them, in Markdown"),
  folders: z.string().describe("Folder tree with a one-line description per entry, no code files"),
  roadmap: z.array(z.string()).describe("5 to 8 verifiable steps; the first small and doable in one session"),
  start: z.string().describe("A single file or activity to start from, with the reason"),
  question: z.string().nullable().describe("At most one question that changes the work, or null"),
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

export function buildInitMessage(bootstrap: string, level: ExperienceLevel, lang: Lang = "it"): string {
  return [
    "MODE: INIT",
    `LEVEL: ${level}`,
    block("bootstrap", bootstrap),
    "Answer by filling in the requested schema. Plain Markdown text, no code blocks except the folder tree.",
    LEVEL_HINTS[level],
    languageLine(lang),
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
export function initPlanToMarkdown(p: InitPlan, lang: Lang = "it"): string {
  const T = INIT_TEXT[lang];
  if (p.blockingQuestion) return `${p.reading}\n\n${T.needAnswer} ${p.blockingQuestion}`;
  const adrs = p.decisions
    .map((d, i) => `**ADR-${pad(i + 1)} · ${cleanTitle(d.title)}**\n${d.decision}\n*${T.ruledOut}* ${d.alternatives}`)
    .join("\n\n");
  return [
    p.reading,
    `### ${T.decisions}\n${adrs}`,
    `### ${T.architecture}\n${p.layers}\n\n\`\`\`\n${p.folders.replace(/^```\w*\n?|```$/g, "").trim()}\n\`\`\``,
    `### ${T.roadmap}\n${p.roadmap.map((s, i) => `${i + 1}. ${s.replace(/^\s*\d+[.)]\s*/, "")}`).join("\n")}`,
    `### ${T.start}\n${p.start}`,
    p.question ? `**${T.question}** ${p.question}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** I file da scrivere in .pebble/ (ADR-002), con percorsi relativi alla radice del progetto. */
export function initPlanToFiles(p: InitPlan, date: string, lang: Lang = "it"): { path: string; content: string }[] {
  const T = INIT_TEXT[lang];
  const header = T.generated(date);
  const files = [
    {
      path: ".pebble/architecture.md",
      content: `${T.archTitle}\n\n${header}\n${T.reading}\n\n${p.reading}\n\n${T.layers}\n\n${p.layers}\n\n${T.folders}\n\n\`\`\`\n${p.folders
        .replace(/^```\w*\n?|```$/g, "")
        .trim()}\n\`\`\`\n`,
    },
    {
      path: ".pebble/roadmap.md",
      content: `# ${T.roadmap}\n\n${header}\n${p.roadmap.map((s, i) => `${i + 1}. ${s.replace(/^\s*\d+[.)]\s*/, "")}`).join("\n")}\n\n## ${T.start}\n\n${p.start}\n${
        p.question ? `\n${T.openQuestion}\n\n${p.question}\n` : ""
      }`,
    },
  ];
  p.decisions.forEach((d, i) => {
    const id = `ADR-${pad(i + 1)}`;
    const title = cleanTitle(d.title);
    files.push({
      path: `.pebble/decisions/${id}-${slug(title)}.md`,
      content: `## ${id}: ${title}\n${T.adrStatus}\n${T.adrContext} ${d.context}\n${T.adrDecision} ${d.decision}\n${T.adrAlternatives} ${d.alternatives}\n${T.adrConsequences} ${d.consequences}\n`,
    });
  });
  return files;
}

// ---------- Modalità in testo libero ----------

export type TextMode = "CHAT" | "TESTS" | "NEW_FILE";

export interface OpenFile {
  path: string;
  content: string;
}

export interface Turn {
  role: "user" | "pebble";
  text: string;
}

const FORMAT_HINT =
  "Answer by filling in the schema. In `answer` use Markdown, short, to be read while working; follow the three zones for code. " +
  "In `decisionChanges` propose changing an existing ADR or a new ADR only if the developer expressed a choice that changes a decision, " +
  "or if a decision is clearly outdated; never to restate what an ADR already says. Otherwise leave the list empty. In `content` write the complete ADR " +
  "in the project's format and language (## ADR-NNN: title, then status, context, decision, alternatives ruled out, consequences).";

export const DecisionChange = z.object({
  target: z.string().nullable().describe("ADR to change, e.g. 'ADR-005'; null for a new ADR"),
  title: z.string().describe("Title of the decision, without a number"),
  reason: z.string().describe("One sentence: why change it or add it"),
  content: z.string().describe("Complete text of the updated or new ADR, in Markdown"),
});
export type DecisionChange = z.infer<typeof DecisionChange>;

export const TextAnswer = z.object({
  answer: z.string().describe("The answer for the developer, in Markdown"),
  decisionChanges: z.array(DecisionChange).describe("Proposed changes to the decisions; usually empty"),
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
  opts: { file?: OpenFile; question?: string; history?: Turn[]; lang?: Lang; problems?: Problem[] } = {},
): string {
  const history = (opts.history ?? [])
    .slice(-8)
    .map((t) => `${t.role === "user" ? "Developer" : "Pebble"}: ${t.text.slice(0, 1500)}`)
    .join("\n\n");
  const fileAttr = opts.file ? ` path="${opts.file.path}"` : "";
  return [
    `MODE: ${mode}`,
    `LEVEL: ${level}`,
    projectBlocks(ctx),
    opts.file ? block("file", mode === "NEW_FILE" ? opts.file.content || "(empty)" : numberLines(opts.file.content), fileAttr) : "",
    opts.file ? formatProblems(opts.problems) : "",
    history ? block("conversation", history) : "",
    opts.question ? `Developer's question:\n${opts.question}` : "",
    FORMAT_HINT,
    LEVEL_HINTS[level],
    languageLine(opts.lang ?? "it"),
  ]
    .filter(Boolean)
    .join("\n");
}
