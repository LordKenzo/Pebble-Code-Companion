import { DIARY_TEXT, type Lang } from "./i18n";
import { parseSection, sectionHeading, type SectionKind } from "./sections";
import { testNameMatches, type Task, type TaskState } from "./path";
import type { ParsedTest } from "./tap";

/**
 * Il diario del sentiero (ADR-013): `.pebble/diario.md`, una sezione per passo, la più recente in alto.
 * Logica pura: Pebble aggiunge una riga per evento, senza modello; le righe che non ha scritto lui restano.
 */
export type DiaryEvent =
  | { kind: "stepPlanned"; tasks: number }
  | { kind: "red"; test: string }
  | { kind: "green"; test: string; seenRed: boolean }
  | { kind: "scaffold"; path: string }
  | { kind: "taskDone"; title: string }
  | { kind: "taskReopened"; title: string }
  | { kind: "help"; file: string; line: number; rung: number | "why" | "deep" | "fix"; concept?: string }
  | { kind: "review"; file: string; notes: number }
  /** Codice scritto da Pebble su richiesta (ADR-016): la rilettura del passo mostra cosa è tuo e cosa no. */
  | { kind: "code"; where: string; level?: string }
  /** Un conflitto risolto dal pannello Git (ADR-017): con quale scelta. */
  | { kind: "conflict"; file: string; how: "union" | "ours" | "theirs" | "both" }
  | { kind: "stepClosed"; done: number; total: number };

export interface DiaryStep {
  n: number;
  title: string;
  /** Passo della roadmap (predefinito), funzionalità o bug (ADR-014). */
  kind?: SectionKind;
}

export function formatEvent(e: DiaryEvent, lang: Lang = "it"): string {
  const T = DIARY_TEXT[lang];
  switch (e.kind) {
    case "stepPlanned": return T.stepPlanned(e.tasks);
    case "red": return T.red(e.test);
    case "green": return T.green(e.test, e.seenRed);
    case "scaffold": return T.scaffold(e.path);
    case "taskDone": return T.taskDone(e.title);
    case "taskReopened": return T.taskReopened(e.title);
    case "help": {
      const rung = e.rung === "why" ? T.why : e.rung === "deep" ? T.deep : e.rung === "fix" ? T.fixFirst : T.rung(e.rung);
      return T.help(`${e.file}:${e.line}`, rung, e.concept);
    }
    case "review": return T.review(e.file, e.notes);
    case "code": return T.code(e.where, e.level);
    case "conflict": return T.conflict(e.file, T.conflictHow[e.how]);
    case "stepClosed": return T.stepClosed(e.done, e.total);
  }
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Data e ora locali, "2026-11-24 10:12": leggibili e ordinabili. */
export function stamp(at: Date): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

const sectionOf = (line: string) => (/^##\s/.test(line) ? parseSection(line) : null);
const ENTRY = /^- (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) · (.*)$/;

/** Il numero di passo da un'intestazione "Passo 3 · …" / "Step 3 · …", o null (solo i passi della roadmap). */
export function stepNumber(heading: string | null | undefined): number | null {
  const sec = parseSection(heading);
  return sec && sec.kind === "step" ? sec.n : null;
}

/** Aggiunge una riga al diario, nella sezione del passo: la crea in alto se non c'è. */
export function appendToDiary(md: string | null, step: DiaryStep, at: Date, event: DiaryEvent, lang: Lang = "it"): string {
  const T = DIARY_TEXT[lang];
  const line = `- ${stamp(at)} · ${formatEvent(event, lang)}`;
  const text = md?.trim() ? md.replace(/\s*$/, "\n") : `${T.title}\n\n${T.intro}\n`;
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();

  const kind = step.kind ?? "step";
  const start = lines.findIndex((l) => {
    const sec = sectionOf(l);
    return !!sec && sec.kind === kind && sec.n === step.n;
  });
  if (start === -1) {
    const heading = sectionHeading({ kind, n: step.n, title: step.title }, lang);
    const firstSection = lines.findIndex((l) => /^##\s/.test(l));
    const block = [heading, "", line, ""];
    if (firstSection === -1) return [...lines, "", ...block].join("\n").replace(/\n{3,}/g, "\n\n").replace(/\n*$/, "\n");
    lines.splice(firstSection, 0, ...block);
    return lines.join("\n").replace(/\n*$/, "\n");
  }
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end === -1) end = lines.length;
  let lastEntry = -1;
  for (let i = start + 1; i < end; i++) if (ENTRY.test(lines[i]!)) lastEntry = i;
  // La nuova riga va dopo l'ultima di Pebble, prima delle note dello sviluppatore che seguono.
  const at_ = lastEntry === -1 ? start + 1 : lastEntry + 1;
  if (lastEntry === -1) lines.splice(at_, 0, "", line);
  else lines.splice(at_, 0, line);
  return lines.join("\n").replace(/\n*$/, "\n");
}

export interface DiaryEntry {
  date: string;
  time: string;
  text: string;
}
export interface DiarySection {
  kind: SectionKind;
  n: number;
  heading: string;
  entries: DiaryEntry[];
  /** Righe scritte dallo sviluppatore, nell'ordine. */
  notes: string[];
}

/** Legge il diario per la mappa: sezioni per passo con le righe di Pebble e le note dello sviluppatore. */
export function parseDiary(md: string | null): DiarySection[] {
  const out: DiarySection[] = [];
  let cur: DiarySection | null = null;
  for (const raw of (md ?? "").split(/\r?\n/)) {
    const sec = sectionOf(raw);
    if (sec) {
      cur = { kind: sec.kind, n: sec.n, heading: raw.replace(/^##\s+/, "").trim(), entries: [], notes: [] };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    const e = ENTRY.exec(raw);
    if (e) cur.entries.push({ date: e[1]!, time: e[2]!, text: e[3]! });
    else if (raw.trim()) cur.notes.push(raw.trim());
  }
  return out;
}

/**
 * Gli eventi dei test tra due verifiche: rosso, e verde dopo un rosso. Solo i test citati dai compiti,
 * e mai alla prima verifica (prev assente), così all'avvio il diario non si riempie di righe già vere.
 */
export function testEvents(
  tasks: readonly Task[],
  prev: readonly ParsedTest[] | undefined,
  next: readonly ParsedTest[],
  seenRed: readonly string[],
): { event: DiaryEvent; step: string | null }[] {
  if (!prev) return [];
  const before = new Map(prev.map((t) => [t.name, t.ok]));
  const out: { event: DiaryEvent; step: string | null }[] = [];
  for (const t of next) {
    const owner = tasks.find((task) => task.conditions.some((c) => c.kind === "tests" && c.names.some((n) => testNameMatches(t.name, n))));
    if (!owner) continue;
    const was = before.get(t.name);
    if (!t.ok && was !== false) out.push({ event: { kind: "red", test: t.name }, step: owner.step });
    if (t.ok && was === false) out.push({ event: { kind: "green", test: t.name, seenRed: seenRed.includes(t.name) }, step: owner.step });
  }
  return out;
}

/** Gli eventi delle caselle che cambiano, e la chiusura di un passo quando l'ultima casella si spunta. */
export function taskEvents(tasks: readonly Task[], states: readonly (TaskState | undefined)[]): { event: DiaryEvent; step: string | null }[] {
  const out: { event: DiaryEvent; step: string | null }[] = [];
  const after = new Map<string, { done: number; total: number; closedNow: boolean }>();
  tasks.forEach((t, i) => {
    const s = states[i];
    const want = s && s.status !== "unknown" ? s.status === "done" : t.checked;
    if (want && !t.checked) out.push({ event: { kind: "taskDone", title: t.title }, step: t.step });
    if (!want && t.checked) out.push({ event: { kind: "taskReopened", title: t.title }, step: t.step });
    const k = t.step ?? "";
    const a = after.get(k) ?? { done: 0, total: 0, closedNow: false };
    a.total += 1;
    if (want) a.done += 1;
    if (want && !t.checked) a.closedNow = true;
    after.set(k, a);
  });
  for (const [step, a] of after) {
    if (a.closedNow && a.done === a.total) out.push({ event: { kind: "stepClosed", done: a.done, total: a.total }, step: step || null });
  }
  return out;
}
