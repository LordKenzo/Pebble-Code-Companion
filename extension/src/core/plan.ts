import { languageLine, PATH_TEXT, type Lang } from "./i18n";
import { z } from "zod";
import { numberLines } from "./context";
import type { ExperienceLevel, ProjectContext } from "./model";
import { projectBlocks } from "./modes";
import { parseCondition, parsePath } from "./path";

/**
 * Il sentiero un passo alla volta (ADR-011): Pebble scompone il prossimo passo della roadmap in compiti,
 * partendo dal codice com'è adesso, e lo propone come diff. Qui la parte pura.
 */

export const PlannedTask = z.object({
  title: z.string().describe("Short title, imperative: 'Implement platesFor'"),
  todo: z.string().describe("One or two concrete sentences: what to do, citing the relevant ADRs"),
  signature: z.string().nullable().describe("The signature of the function to write, if the task has one; otherwise null"),
  doneWhen: z
    .array(z.string())
    .describe('Conditions in the path syntax of the LANGUAGE (it: test "name", file p esporta x, nessun errore in p, dipendenza x, a mano; en: test "name", file p exports x, no errors in p, dependency x, manual)'),
});

export const PlanStep = z.object({
  reading: z.string().describe("1-2 sentences: what is already in the code for this step and what is missing"),
  tasks: z.array(PlannedTask).describe("3 to 7 tasks, in order; the last one is the review with Pebble, manual"),
  question: z.string().nullable().describe("At most one question that changes the step, or null"),
});
export type PlanStep = z.infer<typeof PlanStep>;

export interface RoadmapStep {
  n: number;
  title: string;
  text: string;
}

/** Passi della roadmap: lista numerata ("1. **Setup**: …") o tabella ("| 1 ✅ | **Setup** … |"). */
export function parseRoadmap(markdown: string): RoadmapStep[] {
  const steps: RoadmapStep[] = [];
  for (const raw of markdown.split(/\r?\n/)) {
    const list = /^(\d+)[.)]\s+(.+)$/.exec(raw.trim());
    const row = /^\|\s*(\d+)\s*[^|]*\|\s*([^|]+)\|/.exec(raw.trim());
    const m = list ?? row;
    if (!m) continue;
    const n = Number(m[1]);
    if (steps.some((s) => s.n === n)) continue;
    // "1. 1. Impostare…": a volte il testo ha già il suo numero; si toglie.
    const text = m[2]!.trim().replace(/^(\d+[.)]\s+)+/, "");
    const bold = /\*\*(.+?)\*\*/.exec(text);
    steps.push({ n, title: stepTitle(bold ? bold[1]! : text), text: text.replace(/\*\*/g, "") });
  }
  return steps;
}

/** Titolo breve: fino al primo ";", ": ", ". " o " (", e al massimo circa 48 caratteri tagliati su una parola. */
export function stepTitle(raw: string): string {
  const cut = raw.replace(/[*✅🟡⛔]/g, "").split(/;|:\s|\.\s|\.$|\s\(|\s[—–]\s/)[0]!.trim();
  if (cut.length <= 48) return cut;
  const short = cut.slice(0, 48);
  let t = short.slice(0, short.lastIndexOf(" ") > 20 ? short.lastIndexOf(" ") : 48).trim();
  // Non finire su una parola vuota: "…delle formule e…" diventa "…delle formule…".
  const filler = /\s+(e|ed|o|di|da|a|in|il|lo|la|i|gli|le|per|con|su|tra|fra|del|della|dei|delle|che)$/i;
  while (filler.test(t)) t = t.replace(filler, "");
  return `${t}…`;
}

/** Numeri dei passi già nel percorso, dai titoli "## Passo 2 · …". */
export function plannedStepNumbers(pathMarkdown: string): Map<number, { done: boolean }> {
  const out = new Map<number, { done: boolean }>();
  for (const t of parsePath(pathMarkdown).tasks) {
    const n = Number(/(?:passo|step)\s+(\d+)/i.exec(t.step ?? "")?.[1]);
    if (!Number.isFinite(n) || n < 0) continue;
    const prev = out.get(n);
    out.set(n, { done: (prev?.done ?? true) && t.checked });
  }
  return out;
}

/**
 * Il prossimo passo da preparare: il primo della roadmap che non è nel percorso,
 * ma solo se tutti quelli già nel percorso sono chiusi. Davanti c'è sempre un passo solo.
 */
export function nextStep(roadmap: readonly RoadmapStep[], pathMarkdown: string | null): RoadmapStep | null {
  const planned = plannedStepNumbers(pathMarkdown ?? "");
  if ([...planned.values()].some((s) => !s.done)) return null;
  return roadmap.find((s) => !planned.has(s.n)) ?? null;
}

export interface PlanFile {
  path: string;
  /** Contenuto, solo per i file piccoli e rilevanti; gli altri compaiono solo nell'elenco. */
  content?: string;
}

export function buildPlanMessage(
  ctx: ProjectContext,
  step: RoadmapStep,
  pathMarkdown: string | null,
  files: readonly PlanFile[],
  level: ExperienceLevel,
  lang: Lang = "it",
): string {
  const list = files.map((f) => f.path).join("\n") || "(nessun file oltre a .pebble/)";
  const contents = files
    .filter((f) => f.content !== undefined)
    .map((f) => `<file path="${f.path}">\n${numberLines(f.content!)}\n</file>`)
    .join("\n");
  return [
    "MODE: PLAN_STEP",
    `LEVEL: ${level}`,
    projectBlocks(ctx),
    pathMarkdown?.trim() ? `<path>\n${pathMarkdown.trim()}\n</path>` : "",
    `<files>\n${list}\n</files>`,
    contents,
    `STEP_TO_PREPARE: ${step.n} · ${step.title}\n${step.text}`,
    "Answer by filling in the schema.",
    languageLine(lang),
  ]
    .filter(Boolean)
    .join("\n");
}

const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();

/** Trasforma il piano in una sezione di percorso.md. Le condizioni scritte male vengono scartate. */
export function planToSection(plan: PlanStep, step: RoadmapStep, lang: Lang = "it"): { markdown: string; dropped: string[] } {
  const T = PATH_TEXT[lang];
  const dropped: string[] = [];
  const lines = [`## ${T.stepWord} ${step.n} · ${step.title}`];
  for (const t of plan.tasks.slice(0, 8)) {
    lines.push(`- [ ] ${oneLine(t.title)}`);
    if (t.todo.trim()) lines.push(`  ${T.keyTodo}: ${oneLine(t.todo)}`);
    if (t.signature?.trim()) lines.push(`  ${T.keySignature}: ${oneLine(t.signature)}`);
    const valid = t.doneWhen.map(oneLine).filter((c) => {
      const ok = parseCondition(c).kind !== "invalid";
      if (!ok) dropped.push(c);
      return ok;
    });
    for (const c of valid.length ? valid : [T.condManual]) lines.push(`  ${T.keyDone}: ${c}`);
  }
  return { markdown: lines.join("\n") + "\n", dropped };
}

/**
 * Inserisce la sezione nel percorso. Se il passo c'è già e ha compiti fatti, non tocca niente (null):
 * i passi chiusi sono la storia del progetto (ADR-011). Se c'è ma è tutto da fare, lo sostituisce.
 */
export function insertStep(pathMarkdown: string | null, section: string, n: number, lang: Lang = "it"): string | null {
  const md = pathMarkdown ?? "";
  if (!md.trim()) return `# ${PATH_TEXT[lang].pathTitle}\n\n${section}`;
  const lines = md.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^#{2,3}\\s+(?:passo|step)\\s+${n}\\b`, "i").test(l));
  if (start === -1) return `${md.replace(/\s*$/, "")}\n\n${section}`;
  let end = lines.findIndex((l, i) => i > start && /^#{1,3}\s/.test(l));
  if (end === -1) end = lines.length;
  const body = lines.slice(start, end).join("\n");
  if (/^\s*[-*]\s+\[(x|X)\]/m.test(body)) return null;
  const rest = lines.slice(end).join("\n");
  return [...lines.slice(0, start), section.replace(/\n$/, ""), ...(rest.trim() ? ["", rest] : [""])].join("\n");
}
