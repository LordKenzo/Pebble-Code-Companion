/**
 * Il percorso: compiti in `.pebble/percorso.md` (ADR-007) e quando si considerano fatti (ADR-008).
 * Logica pura: niente vscode, niente file system. Gli adapter forniscono il testo e i segnali.
 *
 * Formato:
 *
 *   ## Passo 2 · Dischi per lato
 *   - [ ] Implementa platesFor
 *     fare: togli il bilanciere, dividi per due, scorri i dischi
 *     firma: platesFor(total: Grams): Result<PlateLoad>
 *     fatto quando: test "20 kg" "60 kg"
 *
 * Il parsing è tollerante: le righe che non riconosce restano nel file e vengono ignorate.
 */

import { PATH_TEXT, type Lang } from "./i18n";

export type Condition =
  | { kind: "tests"; names: string[] }
  | { kind: "file"; path: string; exports: string[] }
  | { kind: "noErrors"; path: string }
  | { kind: "dependency"; names: string[] }
  | { kind: "manual" }
  | { kind: "invalid"; raw: string };

export interface Task {
  /** Indice della riga `- [ ]` nel file, usato per aggiornare la casella. */
  line: number;
  title: string;
  checked: boolean;
  step: string | null;
  todo: string | null;
  signature: string | null;
  /** Tutte devono essere vere. Nessuna condizione = compito a mano. */
  conditions: Condition[];
}

export interface PathDoc {
  tasks: Task[];
}

const TASK = /^\s*[-*]\s+\[( |x|X)\]\s+(.+?)\s*$/;
const STEP = /^#{2,3}\s+(.+?)\s*$/;
const FIELD = /^\s+([^:]+?)\s*:\s*(.*?)\s*$/;
const KEYS: Record<string, "todo" | "signature" | "done"> = {
  fare: "todo",
  do: "todo",
  firma: "signature",
  signature: "signature",
  "fatto quando": "done",
  "done when": "done",
};

export function parsePath(markdown: string): PathDoc {
  const tasks: Task[] = [];
  let step: string | null = null;
  let current: Task | null = null;

  markdown.split("\n").forEach((raw, line) => {
    const text = raw.replace(/\r$/, "");
    const heading = STEP.exec(text);
    if (heading) {
      step = heading[1]!;
      current = null;
      return;
    }
    const task = TASK.exec(text);
    if (task) {
      current = { line, title: task[2]!, checked: task[1] !== " ", step, todo: null, signature: null, conditions: [] };
      tasks.push(current);
      return;
    }
    const field = FIELD.exec(text);
    if (field && current) {
      const key = KEYS[field[1]!.toLowerCase()];
      if (key === "todo") current.todo = field[2]!;
      else if (key === "signature") current.signature = field[2]!;
      else if (key === "done") current.conditions.push(parseCondition(field[2]!));
      return; // chiave sconosciuta: riga conservata e ignorata
    }
    if (text.trim() === "" || /^\s/.test(text)) return; // riga vuota o rientrata: resta nel compito
    current = null; // testo libero non rientrato: chiude il compito
  });
  return { tasks };
}

const QUOTED = /"([^"]+)"|«([^»]+)»/g;

export function parseCondition(raw: string): Condition {
  const s = raw.trim();
  if (/^(a mano|manual)$/i.test(s)) return { kind: "manual" };

  const tests = /^tests?\s+(.+)$/i.exec(s);
  if (tests) {
    const names = [...tests[1]!.matchAll(QUOTED)].map((m) => (m[1] ?? m[2])!.trim()).filter(Boolean);
    return names.length ? { kind: "tests", names } : { kind: "invalid", raw };
  }

  const dep = /^(?:dipendenz[ae]|dependenc(?:y|ies))\s+(.+)$/i.exec(s);
  if (dep) {
    const names = dep[1]!.split(/[\s,]+/).map((n) => n.replace(/^["'«]|["'»]$/g, "")).filter(Boolean);
    return names.length ? { kind: "dependency", names } : { kind: "invalid", raw };
  }

  const noErrors = /^(?:nessun errore in|no errors in)\s+(\S+)$/i.exec(s);
  if (noErrors) return { kind: "noErrors", path: noErrors[1]! };

  const file = /^file\s+(\S+)(?:\s+(?:esporta|exports)\s+(.+))?$/i.exec(s);
  if (file) {
    const exports = (file[2] ?? "").split(/[\s,]+/).filter(Boolean);
    return { kind: "file", path: file[1]!, exports };
  }
  return { kind: "invalid", raw };
}

// ---------- segnali e valutazione ----------

export interface TestResult {
  name: string;
  ok: boolean;
}

/**
 * Quello che gli adapter sanno del progetto in questo momento.
 * Un campo assente vuol dire "non so" (es. test non ancora lanciati), non "falso".
 */
export interface Signals {
  tests?: TestResult[];
  /** Esportazioni per file esistente; un file che manca non compare. */
  files?: Record<string, string[]>;
  /** Numero di errori del compilatore per file. */
  errors?: Record<string, number>;
  /** Dipendenze dichiarate nel manifest del progetto (package.json: dependencies e devDependencies). */
  dependencies?: readonly string[];
  /** Nomi dei test che Pebble ha visto fallire almeno una volta (ADR-010). */
  seenRed?: readonly string[];
}

export interface EvaluateOptions {
  /** Con true, un test mai visto rosso non chiude il compito (ADR-010). Default: false, solo avviso. */
  requireRedFirst?: boolean;
  /** Lingua dei motivi (ADR-012). Default: italiano. */
  lang?: Lang;
}

/** Perché un compito è aperto, in forma che la vista sa riconoscere senza leggere la frase. */
export type ReasonCode = "testMissing" | "testRed" | "neverRed" | "fileMissing" | "fileNoExport" | "errors" | "dependency";

export type TaskState =
  | { status: "done"; progress?: Progress; warning?: string }
  | { status: "open"; progress?: Progress; reason: string; code?: ReasonCode; path?: string }
  /** Non si può decidere con i segnali disponibili: vale la casella nel file. */
  | { status: "unknown"; reason: string };

export interface Progress {
  passed: number;
  total: number;
}

type CondState = { result: "true" | "false" | "unknown"; reason?: string; progress?: Progress; warning?: string; code?: ReasonCode; path?: string };

/** Il nome di un test contiene il nome cercato come parola intera: "20 kg" trova "20 kg: nessun disco", non "120 kg". */
export function testNameMatches(testName: string, wanted: string): boolean {
  const hay = testName.toLowerCase();
  const needle = wanted.toLowerCase();
  const isWord = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);
  const isDigit = (c: string | undefined) => c !== undefined && /\d/.test(c);
  // "5 kg" non deve trovare "22,5 kg": una virgola o un punto tra due cifre fa parte del numero.
  const joinedBefore = (i: number) =>
    isWord(hay[i - 1]) || (/[.,]/.test(hay[i - 1] ?? "") && isDigit(hay[i - 2]) && isDigit(needle[0]));
  const joinedAfter = (end: number) =>
    isWord(hay[end]) || (/[.,]/.test(hay[end] ?? "") && isDigit(hay[end + 1]) && isDigit(needle[needle.length - 1]));
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + 1)) {
    const end = i + needle.length;
    const startOk = !joinedBefore(i) || !isWord(needle[0]);
    const endOk = !joinedAfter(end) || !isWord(needle[needle.length - 1]);
    if (startOk && endOk) return true;
  }
  return false;
}

function checkCondition(c: Condition, s: Signals, opts: EvaluateOptions): CondState {
  const T = PATH_TEXT[opts.lang ?? "it"];
  switch (c.kind) {
    case "manual":
      return { result: "unknown", reason: T.manual };
    case "invalid":
      return { result: "unknown", reason: T.invalid(c.raw) };
    case "tests": {
      if (!s.tests) return { result: "unknown", reason: T.testsNotRun };
      let passed = 0;
      const missing: string[] = [];
      const failing: string[] = [];
      const neverRed: string[] = [];
      const seen = s.seenRed ? new Set(s.seenRed) : null;
      for (const name of c.names) {
        const found = s.tests.filter((t) => testNameMatches(t.name, name));
        if (found.length === 0) missing.push(name);
        else if (found.every((t) => t.ok)) {
          passed++;
          if (seen && found.some((t) => !seen.has(t.name))) neverRed.push(name);
        } else failing.push(name);
      }
      const progress = { passed, total: c.names.length };
      if (missing.length) return { result: "false", progress, reason: T.testMissing(missing), code: "testMissing" };
      if (failing.length) return { result: "false", progress, reason: T.testRed(failing), code: "testRed" };
      if (neverRed.length) {
        const msg = T.neverRed(neverRed);
        return opts.requireRedFirst ? { result: "false", progress, reason: msg, code: "neverRed" } : { result: "true", progress, warning: msg };
      }
      return { result: "true", progress };
    }
    case "file": {
      if (!s.files) return { result: "unknown", reason: T.filesNotChecked };
      const exported = s.files[c.path];
      if (!exported) return { result: "false", reason: T.fileMissing(c.path), code: "fileMissing", path: c.path };
      const absent = c.exports.filter((e) => !exported.includes(e));
      return absent.length ? { result: "false", reason: T.fileNoExport(c.path, absent), code: "fileNoExport", path: c.path } : { result: "true" };
    }
    case "dependency": {
      if (!s.dependencies) return { result: "unknown", reason: T.depsNotChecked };
      const missing = c.names.filter((n) => !s.dependencies!.includes(n));
      return missing.length ? { result: "false", reason: T.depMissing(missing), code: "dependency" } : { result: "true" };
    }
    case "noErrors": {
      if (!s.errors || !s.files) return { result: "unknown", reason: T.errorsNotChecked };
      if (!s.files[c.path]) return { result: "false", reason: T.fileMissing(c.path), code: "fileMissing", path: c.path };
      const n = s.errors[c.path] ?? 0;
      return n === 0 ? { result: "true" } : { result: "false", reason: T.errorsIn(n, c.path), code: "errors", path: c.path };
    }
  }
}

/**
 * Stato di ogni compito dati i segnali. Senza memoria: un test che torna rosso riapre il compito.
 * Un compito è fatto se tutte le condizioni sono vere; aperto se almeno una è falsa;
 * altrimenti non si sa, e vale la casella nel file.
 */
export function evaluate(tasks: readonly Task[], signals: Signals, opts: EvaluateOptions = {}): TaskState[] {
  return tasks.map((task) => {
    const conds = task.conditions.length ? task.conditions : [{ kind: "manual" } as const];
    const states = conds.map((c) => checkCondition(c, signals, opts));
    const progress = states.find((x) => x.progress)?.progress;
    const failed = states.find((x) => x.result === "false");
    if (failed) {
      return { status: "open", reason: failed.reason!, ...(progress && { progress }), ...(failed.code && { code: failed.code }), ...(failed.path && { path: failed.path }) };
    }
    const unknown = states.find((x) => x.result === "unknown");
    if (unknown) return { status: "unknown", reason: unknown.reason! };
    const warning = states.find((x) => x.warning)?.warning;
    return { status: "done", ...(progress && { progress }), ...(warning && { warning }) };
  });
}

/** Aggiunge alla cronologia i test rossi di quest'ultima esecuzione (ADR-010). */
export function updateSeenRed(prev: readonly string[], results: readonly TestResult[]): string[] {
  const out = [...prev];
  const known = new Set(prev);
  for (const t of results) {
    if (!t.ok && !known.has(t.name)) {
      known.add(t.name);
      out.push(t.name);
    }
  }
  return out;
}

/**
 * Aggiorna le caselle nel testo in base allo stato. Cambia solo il carattere tra le parentesi
 * delle righe interessate: il resto del file resta identico, così il diff è minimo (ADR-007).
 */
export function applyStates(markdown: string, tasks: readonly Task[], states: readonly TaskState[]): { text: string; changed: number } {
  const lines = markdown.split("\n");
  let changed = 0;
  tasks.forEach((task, i) => {
    const state = states[i];
    if (!state || state.status === "unknown") return;
    const want = state.status === "done";
    if (want === task.checked) return;
    const updated = withCheckbox(lines[task.line], want);
    if (updated === null) return; // file cambiato nel frattempo: non toccare
    lines[task.line] = updated;
    changed++;
  });
  return { text: lines.join("\n"), changed };
}

/** La riga con la casella spuntata o no; null se la riga non è un compito (il file è cambiato). */
export function withCheckbox(line: string | undefined, checked: boolean): string | null {
  if (line === undefined || !TASK.test(line)) return null;
  return line.replace(/\[( |x|X)\]/, checked ? "[x]" : "[ ]");
}

/** Testo leggibile di una condizione, per la vista del percorso e per il contesto del modello. */
export function describeCondition(c: Condition, lang: Lang = "it"): string {
  const T = PATH_TEXT[lang];
  switch (c.kind) {
    case "tests":
      return T.descTests(c.names);
    case "file":
      return T.descFile(c.path, c.exports);
    case "noErrors":
      return T.descNoErrors(c.path);
    case "dependency":
      return T.descDependency(c.names);
    case "manual":
      return T.descManual;
    case "invalid":
      return T.descInvalid(c.raw);
  }
}

/**
 * Cosa si aspetta Pebble, spiegato a chi legge il compito per la prima volta.
 * Per i test c'è un esempio di come si scrive il nome: è il nome che conta, non quello che il test verifica.
 */
export function explainCondition(c: Condition, lang: Lang = "it"): { text: string; example?: string } {
  const T = PATH_TEXT[lang];
  switch (c.kind) {
    case "tests":
      return c.names.length === 1
        ? { text: T.expTests1(c.names[0]!), example: `test("${c.names[0]}", () => { … })` }
        : { text: T.expTestsN(c.names), example: `test("${c.names[0]}: …", () => { … })` };
    case "file":
      return c.exports.length
        ? { text: T.expFileExports(c.path, c.exports), example: c.exports.map((e) => `export … ${e}`).join("\n") }
        : { text: T.expFile(c.path) };
    case "noErrors":
      return { text: T.expNoErrors(c.path) };
    case "dependency":
      return c.names.length === 1
        ? { text: T.expDependency1(c.names[0]!), example: `npm install -D ${c.names[0]}` }
        : { text: T.expDependencyN(c.names), example: `npm install -D ${c.names.join(" ")}` };
    case "manual":
      return { text: T.expManual };
    case "invalid":
      return { text: T.expInvalid(c.raw) };
  }
}

/** Riassunto breve accanto al titolo del compito: "3 test · 0 errori", "a mano". */
export function summarizeConditions(conditions: readonly Condition[], lang: Lang = "it"): string {
  const T = PATH_TEXT[lang];
  if (conditions.length === 0) return T.sumManual;
  return conditions
    .map((c) => {
      switch (c.kind) {
        case "tests":
          return T.sumTests(c.names.length);
        case "file":
          return T.sumFile;
        case "noErrors":
          return T.sumNoErrors;
        case "dependency":
          return T.sumDependency;
        case "manual":
          return T.sumManual;
        case "invalid":
          return T.sumInvalid;
      }
    })
    .join(" · ");
}

// ---------- modello per la vista (mockup/on-demand.html) ----------

export interface PathViewModel {
  done: number;
  total: number;
  /** Indice del passo da mostrare aperto: il primo con compiti da fare (o l'ultimo, se è tutto fatto). */
  currentStep: number;
  steps: StepView[];
}

export interface StepView {
  name: string;
  /** ADR citati nei compiti del passo, in ordine: "ADR-003", "ADR-004". */
  refs: string[];
  done: number;
  total: number;
  tasks: TaskView[];
}

export interface TaskView {
  line: number;
  title: string;
  checked: boolean;
  /** Il compito attivo: il primo da fare del passo corrente. */
  current: boolean;
  todo: string | null;
  signature: string | null;
  summary: string;
  when: { text: string; invalid: boolean }[];
  /** File citati dalle condizioni (file, nessun errore in): candidati per "Prepara il file". */
  files: string[];
  /** "Cosa mi aspetto": le condizioni spiegate, con un esempio quando serve. */
  expect: { text: string; example?: string; invalid: boolean }[];
  /** Stato dai segnali; assente se non si può decidere (vale la casella). */
  state?: { status: "done" | "open"; progress?: Progress; reason?: string; warning?: string; code?: ReasonCode; path?: string };
}

export function buildViewModel(tasks: readonly Task[], states?: readonly TaskState[], lang: Lang = "it"): PathViewModel {
  const stateOf = new Map(tasks.map((t, i) => [t.line, states?.[i]] as const));
  const byStep = new Map<string, Task[]>();
  for (const t of tasks) {
    const name = t.step ?? PATH_TEXT[lang].noStep;
    byStep.set(name, [...(byStep.get(name) ?? []), t]);
  }
  const groups = [...byStep];
  const firstOpen = groups.findIndex(([, ts]) => ts.some((t) => !t.checked));
  const currentStep = firstOpen === -1 ? Math.max(0, groups.length - 1) : firstOpen;

  const steps = groups.map(([name, ts], i): StepView => {
    const activeLine = i === currentStep ? ts.find((t) => !t.checked)?.line : undefined;
    const text = ts.map((t) => [t.title, t.todo, t.signature].join(" ")).join(" ");
    const refs = [...new Set(text.match(/ADR-\d{3}/g) ?? [])].sort();
    return {
      name,
      refs,
      done: ts.filter((t) => t.checked).length,
      total: ts.length,
      tasks: ts.map((t) => ({
        line: t.line,
        title: t.title,
        checked: t.checked,
        current: t.line === activeLine,
        todo: t.todo,
        signature: t.signature,
        summary: summarizeConditions(t.conditions, lang),
        when: (t.conditions.length ? t.conditions : [{ kind: "manual" } as const]).map((c) => ({
          text: describeCondition(c, lang),
          invalid: c.kind === "invalid",
        })),
        expect: (t.conditions.length ? t.conditions : [{ kind: "manual" } as const]).map((c) => ({ ...explainCondition(c, lang), invalid: c.kind === "invalid" })),
        files: [...new Set(t.conditions.flatMap((c) => (c.kind === "file" || c.kind === "noErrors" ? [c.path] : [])))],
        ...viewState(stateOf.get(t.line)),
      })),
    };
  });
  return { done: tasks.filter((t) => t.checked).length, total: tasks.length, currentStep, steps };
}

function viewState(s: TaskState | undefined): { state?: TaskView["state"] } {
  if (!s || s.status === "unknown") return {};
  if (s.status === "done") return { state: { status: "done", ...(s.progress && { progress: s.progress }), ...(s.warning && { warning: s.warning }) } };
  return { state: { status: "open", reason: s.reason, ...(s.progress && { progress: s.progress }), ...(s.code && { code: s.code }), ...(s.path && { path: s.path }) } };
}

/** Simboli esportati da un sorgente TypeScript o JavaScript, per il segnale `files`. */
export function findExports(source: string): string[] {
  const names = new Set<string>();
  const decl = /^\s*export\s+(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of source.matchAll(decl)) names.add(m[1]!);
  const list = /^\s*export\s+(?:type\s+)?\{([^}]*)\}/gm;
  for (const m of source.matchAll(list)) {
    for (const part of m[1]!.split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.replace(/^type\s+/, "").trim();
      if (name) names.add(name);
    }
  }
  return [...names];
}
