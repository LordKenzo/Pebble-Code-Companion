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
  title: z.string().describe("Titolo breve, all'imperativo: 'Implementa platesFor'"),
  todo: z.string().describe("Una o due frasi concrete: cosa fare, citando gli ADR che c'entrano"),
  signature: z.string().nullable().describe("La firma della funzione da scrivere, se il compito ne ha una; altrimenti null"),
  doneWhen: z
    .array(z.string())
    .describe('Condizioni nella sintassi del percorso: test "nome", file percorso esporta simbolo, nessun errore in percorso, a mano'),
});

export const PlanStep = z.object({
  reading: z.string().describe("1-2 frasi: cosa c'è già nel codice per questo passo e cosa manca"),
  tasks: z.array(PlannedTask).describe("Da 3 a 7 compiti, in ordine; l'ultimo è 'Rileggi con Pebble', a mano"),
  question: z.string().nullable().describe("Al massimo una domanda che cambia il passo, o null"),
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
    const text = m[2]!.trim();
    const bold = /\*\*(.+?)\*\*/.exec(text);
    const title = (bold ? bold[1]! : text.split(/[:.]/)[0]!).replace(/[*✅🟡⛔]/g, "").trim().slice(0, 60);
    steps.push({ n, title, text: text.replace(/\*\*/g, "") });
  }
  return steps;
}

/** Numeri dei passi già nel percorso, dai titoli "## Passo 2 · …". */
export function plannedStepNumbers(pathMarkdown: string): Map<number, { done: boolean }> {
  const out = new Map<number, { done: boolean }>();
  for (const t of parsePath(pathMarkdown).tasks) {
    const n = Number(/passo\s+(\d+)/i.exec(t.step ?? "")?.[1]);
    if (!Number.isFinite(n) || n <= 0) continue;
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
): string {
  const list = files.map((f) => f.path).join("\n") || "(nessun file oltre a .pebble/)";
  const contents = files
    .filter((f) => f.content !== undefined)
    .map((f) => `<file path="${f.path}">\n${numberLines(f.content!)}\n</file>`)
    .join("\n");
  return [
    "MODE: PLAN_STEP",
    `LIVELLO: ${level}`,
    projectBlocks(ctx),
    pathMarkdown?.trim() ? `<percorso>\n${pathMarkdown.trim()}\n</percorso>` : "",
    `<files>\n${list}\n</files>`,
    contents,
    `PASSO DA PREPARARE: ${step.n} · ${step.title}\n${step.text}`,
    "Rispondi compilando lo schema.",
  ]
    .filter(Boolean)
    .join("\n");
}

const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();

/** Trasforma il piano in una sezione di percorso.md. Le condizioni scritte male vengono scartate. */
export function planToSection(plan: PlanStep, step: RoadmapStep): { markdown: string; dropped: string[] } {
  const dropped: string[] = [];
  const lines = [`## Passo ${step.n} · ${step.title}`];
  for (const t of plan.tasks.slice(0, 8)) {
    lines.push(`- [ ] ${oneLine(t.title)}`);
    if (t.todo.trim()) lines.push(`  fare: ${oneLine(t.todo)}`);
    if (t.signature?.trim()) lines.push(`  firma: ${oneLine(t.signature)}`);
    const valid = t.doneWhen.map(oneLine).filter((c) => {
      const ok = parseCondition(c).kind !== "invalid";
      if (!ok) dropped.push(c);
      return ok;
    });
    for (const c of valid.length ? valid : ["a mano"]) lines.push(`  fatto quando: ${c}`);
  }
  return { markdown: lines.join("\n") + "\n", dropped };
}

/**
 * Inserisce la sezione nel percorso. Se il passo c'è già e ha compiti fatti, non tocca niente (null):
 * i passi chiusi sono la storia del progetto (ADR-011). Se c'è ma è tutto da fare, lo sostituisce.
 */
export function insertStep(pathMarkdown: string | null, section: string, n: number): string | null {
  const md = pathMarkdown ?? "";
  if (!md.trim()) return `# Percorso\n\n${section}`;
  const lines = md.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^#{2,3}\\s+passo\\s+${n}\\b`, "i").test(l));
  if (start === -1) return `${md.replace(/\s*$/, "")}\n\n${section}`;
  let end = lines.findIndex((l, i) => i > start && /^#{1,3}\s/.test(l));
  if (end === -1) end = lines.length;
  const body = lines.slice(start, end).join("\n");
  if (/^\s*[-*]\s+\[(x|X)\]/m.test(body)) return null;
  const rest = lines.slice(end).join("\n");
  return [...lines.slice(0, start), section.replace(/\n$/, ""), ...(rest.trim() ? ["", rest] : [""])].join("\n");
}
