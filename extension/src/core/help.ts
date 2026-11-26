import { languageLine, type Lang } from "./i18n";
import { formatProblems, numberLines } from "./context";
import type { ExperienceLevel, Problem, ProjectContext } from "./model";
import { projectBlocks } from "./modes";
import type { TestResult } from "./path";

/**
 * Il fumetto sulla riga (MODE: HELP, ADR-009): messaggio per il modello e lettura della risposta.
 * Il formato è lo stesso degli eval 15-19, così quello che è stato verificato vale anche qui.
 */
export type Rung = 1 | 2 | 3 | 4;

export const RUNG_NAMES: Record<Rung, string> = {
  1: "Domanda",
  2: "Direzione precisa",
  3: "Esempio analogo",
  4: "La riga esatta",
};

export type HelpAsk =
  | { kind: "rung"; rung: Rung }
  | { kind: "reply"; rung: Rung; text: string }
  | { kind: "why"; rung: Rung }
  | { kind: "deep"; rung: Rung }
  /** *Mostrami il codice* (ADR-016): il codice corretto per il caso, nella forma del livello. */
  | { kind: "code"; rung: Rung };

export interface HelpTask {
  title: string;
  todo: string | null;
  signature: string | null;
  when: string[];
}

export interface HelpRequest {
  ctx: ProjectContext;
  level: ExperienceLevel;
  file: { path: string; content: string };
  /** Riga del cursore, contata da 1 come nel file numerato. */
  line: number;
  ask: HelpAsk;
  /** Quello che il fumetto ha già detto, in ordine. */
  history: string[];
  task?: HelpTask;
  tests?: (TestResult & { detail?: string })[];
  /** Errori dell'editor sul file: se ci sono, il fumetto sistema prima quelli. */
  problems?: Problem[];
  /** Lingua della risposta (ADR-012). Default: italiano. */
  lang?: Lang;
}

const HELP_LEVEL: Record<ExperienceLevel, string> = {
  entry: "Entry level: plain words, explain each technical term in brackets the first time; to point to more reading, only the stack's official docs.",
  junior: "Junior level: name the principle at play when useful, in one sentence.",
  mid: "",
  senior: "Senior level: terse, no explanations of known concepts; community sources are fine when they add something.",
};

const MAX_TESTS = 30;

function block(tag: string, body: string, attrs = ""): string {
  return `<${tag}${attrs}>\n${body.trim()}\n</${tag}>`;
}

/** I test rossi per primi, con il motivo rientrato sotto: "✖ 60 kg … / atteso [20], ricevuto […]". */
export function formatTests(tests: readonly (TestResult & { detail?: string })[]): string {
  const ordered = [...tests.filter((t) => !t.ok), ...tests.filter((t) => t.ok)].slice(0, MAX_TESTS);
  const lines = ordered.map((t) => {
    if (t.ok) return `✔ ${t.name}`;
    const detail = (t.detail ?? "").split("\n").map((l) => l.trimEnd()).filter((l) => l.trim()).slice(0, 12);
    return [`✖ ${t.name}`, ...detail.map((l) => `    ${l}`)].join("\n");
  });
  const failed = tests.filter((t) => !t.ok).length;
  lines.push(`ℹ tests ${tests.length} · pass ${tests.length - failed} · fail ${failed}`);
  return lines.join("\n");
}

export function buildHelpMessage(req: HelpRequest): string {
  const { ask } = req;
  const head = ["MODE: HELP", `LEVEL: ${req.level}`];
  if (ask.kind === "rung") head.push(`RUNG: ${ask.rung}`);
  else head.push(`RUNG: ${ask.rung}`, ask.kind === "why" ? "WHY: yes" : ask.kind === "deep" ? "DEEP_DIVE: yes" : ask.kind === "code" ? "CODE: yes" : "");

  const task = req.task
    ? block("task", [req.task.title, req.task.todo && `fare: ${req.task.todo}`, req.task.signature && `firma: ${req.task.signature}`, ...req.task.when.map((w) => `fatto quando: ${w}`)].filter(Boolean).join("\n"))
    : "";

  return [
    head.filter(Boolean).join("\n"),
    projectBlocks(req.ctx),
    task,
    block("file", numberLines(req.file.content), ` path="${req.file.path}"`),
    `<cursor line="${req.line}">`,
    formatProblems(req.problems),
    req.tests?.length ? block("tests", formatTests(req.tests)) : "",
    req.history.length ? block("history", req.history.join("\n")) : "",
    ask.kind === "reply" ? block("reply", ask.text) : "",
    HELP_LEVEL[req.level],
    languageLine(req.lang ?? "it"),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Separa il corpo della risposta dalla riga "**Concetto:** …", che finisce nel quaderno. */
export function parseHelpAnswer(text: string): { body: string; concept: string | null } {
  const re = /^\s*\*\*(?:Concetto|Concept):\*\*\s*(.+?)\s*$/im;
  const m = re.exec(text);
  if (!m) return { body: text.trim(), concept: null };
  return { body: text.replace(re, "").trim(), concept: m[1]!.replace(/\.$/, "") };
}

/** Riassunto di una risposta per la cronologia del fumetto: titolo e prima frase utile. */
export function historyLine(answer: string): string {
  const lines = answer.split("\n").map((l) => l.trim()).filter(Boolean);
  const title = (lines[0] ?? "").replace(/\*\*/g, "");
  const first = lines.slice(1).join(" ").replace(/\*\*/g, "").slice(0, 300);
  return first ? `${title}: ${first}` : title;
}
