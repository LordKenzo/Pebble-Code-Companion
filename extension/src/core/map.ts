import type { DiaryEntry, DiarySection } from "./diary";
import { parseSection, sectionKey, type SectionKind } from "./sections";
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
  kind: SectionKind;
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
  /** Sentieri brevi per funzionalità e bug (ADR-014): rami a parte, ognuno con il suo diario. */
  paths: MapStep[];
  stepsDone: number;
  tasksDone: number;
  tasksTotal: number;
}

const RED = /^(rosso|red)\b/i;
const GREEN = /^(verde|green)\b/i;
const HELP = /^(fumetto|balloon)\b/i;
const CONCEPT = /\b(concetto|concept):/i;

export function buildMapModel(roadmap: readonly RoadmapStep[], tasks: readonly Task[], diary: readonly DiarySection[]): MapModel {
  const byKey = new Map<string, Task[]>();
  const headings = new Map<string, string>();
  const pathOrder: { kind: SectionKind; n: number }[] = [];
  for (const t of tasks) {
    const sec = parseSection(t.step);
    if (!sec) continue;
    const key = sectionKey(sec);
    if (!byKey.has(key) && sec.kind !== "step") pathOrder.push({ kind: sec.kind, n: sec.n });
    byKey.set(key, [...(byKey.get(key) ?? []), t]);
    if (!headings.has(key)) headings.set(key, sec.title);
  }
  const stepNumbers = [...byKey.keys()].filter((k) => k.startsWith("step:")).map((k) => Number(k.slice(5)));
  const diarySteps = diary.filter((d) => d.kind === "step").map((d) => d.n);
  const numbers = [...new Set([...roadmap.map((r) => r.n), ...stepNumbers, ...diarySteps])].sort((a, b) => a - b);
  const view = (kind: SectionKind, n: number, state: MapState, ts: readonly Task[], r?: RoadmapStep): MapStep => {
    const key = sectionKey({ kind, n });
    const d = diary.find((x) => x.kind === kind && x.n === n);
    const entries = d?.entries ?? [];
    const texts = entries.map((e) => e.text);
    return {
      kind,
      n,
      title: r?.title || headings.get(key) || d?.heading.split("·").slice(1).join("·").trim() || String(n),
      state,
      done: ts.filter((t) => t.checked).length,
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
  };
  let currentTaken = false;
  const steps = numbers.map((n): MapStep => {
    const r = roadmap.find((x) => x.n === n);
    const ts = byKey.get(`step:${n}`) ?? [];
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
    return view("step", n, state, ts, r);
  });
  const paths = pathOrder.map(({ kind, n }) => {
    const ts = byKey.get(sectionKey({ kind, n })) ?? [];
    return view(kind, n, ts.every((t) => t.checked) ? "done" : "current", ts);
  });
  return {
    steps,
    paths,
    stepsDone: steps.filter((s) => s.state === "done").length,
    tasksDone: tasks.filter((t) => t.checked).length,
    tasksTotal: tasks.length,
  };
}

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ""));

/** La domanda per "Rivedi il passo": compiti e diario del passo, così il Mentor parla di quello che è successo. */
export function stepReviewQuestion(step: MapStep, tasks: readonly Task[], lang: Lang = "it"): { label: string; question: string } {
  const T = MAP_TEXT[lang];
  const own = tasks
    .filter((t) => {
      const sec = parseSection(t.step);
      return !!sec && sec.kind === step.kind && sec.n === step.n;
    })
    .map((t) => `- [${t.checked ? "x" : " "}] ${t.title}`);
  const diary = [...step.entries.map((e) => `- ${e.date} ${e.time} · ${e.text}`), ...step.notes];
  return {
    label: fill(T.reviewLabel, { n: step.n, title: step.title }),
    question: [fill(T.reviewQuestion, { n: step.n, title: step.title }), own.length ? `\n${T.reviewTasks}\n${own.join("\n")}` : "", diary.length ? `\n${T.reviewDiary}\n${diary.join("\n")}` : ""]
      .filter(Boolean)
      .join("\n"),
  };
}
