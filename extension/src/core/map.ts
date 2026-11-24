import type { DiaryEntry, DiarySection } from "./diary";
import { stepNumber } from "./diary";
import type { Task } from "./path";
import type { RoadmapStep } from "./plan";
import { MAP_TEXT, type Lang } from "./i18n";

/**
 * La mappa del sentiero (ADR-013): roadmap, percorso e diario in un solo modello per la vista.
 * I passi senza compiti sono solo titoli della roadmap (ADR-011).
 */
/** "next": il primo passo da preparare quando tutti quelli preparati sono chiusi. */
export type MapState = "done" | "current" | "next" | "future";

export interface MapStep {
  n: number;
  title: string;
  state: MapState;
  done: number;
  total: number;
  /** Prima e ultima data del diario del passo ("2026-11-24"), se ci sono righe. */
  from: string | null;
  to: string | null;
  entries: DiaryEntry[];
  notes: string[];
  counts: { red: number; green: number; help: number; concepts: number };
  /** Testo della roadmap, per i passi ancora da preparare. */
  roadmap: string | null;
}

export interface MapModel {
  steps: MapStep[];
  stepsDone: number;
  tasksDone: number;
  tasksTotal: number;
}

const RED = /^(rosso|red)\b/i;
const GREEN = /^(verde|green)\b/i;
const HELP = /^(fumetto|balloon)\b/i;
const CONCEPT = /\b(concetto|concept):/i;

export function buildMapModel(roadmap: readonly RoadmapStep[], tasks: readonly Task[], diary: readonly DiarySection[]): MapModel {
  const byStep = new Map<number, Task[]>();
  const headings = new Map<number, string>();
  for (const t of tasks) {
    const n = stepNumber(t.step);
    if (n === null) continue;
    byStep.set(n, [...(byStep.get(n) ?? []), t]);
    if (!headings.has(n)) headings.set(n, t.step!.split("·").slice(1).join("·").trim());
  }
  const numbers = [...new Set([...roadmap.map((r) => r.n), ...byStep.keys(), ...diary.map((d) => d.n)])].sort((a, b) => a - b);
  let currentTaken = false;
  const steps = numbers.map((n): MapStep => {
    const r = roadmap.find((x) => x.n === n);
    const ts = byStep.get(n) ?? [];
    const done = ts.filter((t) => t.checked).length;
    let state: MapState = "future";
    if (ts.length && done === ts.length) state = "done";
    else if (ts.length && !currentTaken) {
      state = "current";
      currentTaken = true;
    } else if (!ts.length && !currentTaken) {
      state = "next";
      currentTaken = true;
    }
    const d = diary.find((x) => x.n === n);
    const entries = d?.entries ?? [];
    const texts = entries.map((e) => e.text);
    return {
      n,
      title: r?.title || headings.get(n) || d?.heading.split("·").slice(1).join("·").trim() || String(n),
      state,
      done,
      total: ts.length,
      from: entries[0]?.date ?? null,
      to: entries[entries.length - 1]?.date ?? null,
      entries,
      notes: d?.notes ?? [],
      counts: {
        red: texts.filter((t) => RED.test(t)).length,
        green: texts.filter((t) => GREEN.test(t)).length,
        help: texts.filter((t) => HELP.test(t)).length,
        concepts: texts.filter((t) => CONCEPT.test(t)).length,
      },
      roadmap: (state === "future" || state === "next") && !ts.length ? r?.text ?? null : null,
    };
  });
  return {
    steps,
    stepsDone: steps.filter((s) => s.state === "done").length,
    tasksDone: tasks.filter((t) => t.checked).length,
    tasksTotal: tasks.length,
  };
}

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ""));

/** La domanda per "Rivedi il passo": compiti e diario del passo, così il Mentor parla di quello che è successo. */
export function stepReviewQuestion(step: MapStep, tasks: readonly Task[], lang: Lang = "it"): { label: string; question: string } {
  const T = MAP_TEXT[lang];
  const own = tasks.filter((t) => stepNumber(t.step) === step.n).map((t) => `- [${t.checked ? "x" : " "}] ${t.title}`);
  const diary = [...step.entries.map((e) => `- ${e.date} ${e.time} · ${e.text}`), ...step.notes];
  return {
    label: fill(T.reviewLabel, { n: step.n, title: step.title }),
    question: [fill(T.reviewQuestion, { n: step.n, title: step.title }), own.length ? `\n${T.reviewTasks}\n${own.join("\n")}` : "", diary.length ? `\n${T.reviewDiary}\n${diary.join("\n")}` : ""]
      .filter(Boolean)
      .join("\n"),
  };
}
