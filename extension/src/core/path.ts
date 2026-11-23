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

export type Condition =
  | { kind: "tests"; names: string[] }
  | { kind: "file"; path: string; exports: string[] }
  | { kind: "noErrors"; path: string }
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
  /** Nomi dei test che Pebble ha visto fallire almeno una volta (ADR-010). */
  seenRed?: readonly string[];
}

export interface EvaluateOptions {
  /** Con true, un test mai visto rosso non chiude il compito (ADR-010). Default: false, solo avviso. */
  requireRedFirst?: boolean;
}

export type TaskState =
  | { status: "done"; progress?: Progress; warning?: string }
  | { status: "open"; progress?: Progress; reason: string }
  /** Non si può decidere con i segnali disponibili: vale la casella nel file. */
  | { status: "unknown"; reason: string };

export interface Progress {
  passed: number;
  total: number;
}

type CondState = { result: "true" | "false" | "unknown"; reason?: string; progress?: Progress; warning?: string };

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
  switch (c.kind) {
    case "manual":
      return { result: "unknown", reason: "si spunta a mano" };
    case "invalid":
      return { result: "unknown", reason: `condizione non riconosciuta: ${c.raw}` };
    case "tests": {
      if (!s.tests) return { result: "unknown", reason: "test non ancora lanciati" };
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
      const quote = (xs: string[]) => xs.map((m) => `"${m}"`).join(", ");
      const progress = { passed, total: c.names.length };
      if (missing.length) return { result: "false", progress, reason: `test non trovato: ${quote(missing)}` };
      if (failing.length) return { result: "false", progress, reason: `test rosso: ${quote(failing)}` };
      if (neverRed.length) {
        const msg = `verde, ma non l'ho mai visto fallire: ${quote(neverRed)}. Rompi il codice un momento e guarda se il test se ne accorge.`;
        return opts.requireRedFirst ? { result: "false", progress, reason: msg } : { result: "true", progress, warning: msg };
      }
      return { result: "true", progress };
    }
    case "file": {
      if (!s.files) return { result: "unknown", reason: "file non ancora controllati" };
      const exported = s.files[c.path];
      if (!exported) return { result: "false", reason: `manca ${c.path}` };
      const absent = c.exports.filter((e) => !exported.includes(e));
      return absent.length ? { result: "false", reason: `${c.path} non esporta ${absent.join(", ")}` } : { result: "true" };
    }
    case "noErrors": {
      if (!s.errors || !s.files) return { result: "unknown", reason: "errori non ancora controllati" };
      if (!s.files[c.path]) return { result: "false", reason: `manca ${c.path}` };
      const n = s.errors[c.path] ?? 0;
      return n === 0 ? { result: "true" } : { result: "false", reason: `${n} ${n === 1 ? "errore" : "errori"} in ${c.path}` };
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
    if (failed) return { status: "open", reason: failed.reason!, ...(progress && { progress }) };
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

/** Testo leggibile di una condizione, per la vista del percorso. */
export function describeCondition(c: Condition): string {
  switch (c.kind) {
    case "tests":
      return c.names.length === 1
        ? `passa un test che si chiama "${c.names[0]}"`
        : `passano i test che si chiamano ${c.names.map((n) => `"${n}"`).join(", ")}`;
    case "file":
      return c.exports.length ? `${c.path} esporta ${c.exports.join(", ")}` : `esiste ${c.path}`;
    case "noErrors":
      return `nessun errore in ${c.path}`;
    case "manual":
      return "a mano";
    case "invalid":
      return `non riconosciuta: ${c.raw}`;
  }
}

/**
 * Cosa si aspetta Pebble, spiegato a chi legge il compito per la prima volta.
 * Per i test c'è un esempio di come si scrive il nome: è il nome che conta, non quello che il test verifica.
 */
export function explainCondition(c: Condition): { text: string; example?: string } {
  switch (c.kind) {
    case "tests":
      return c.names.length === 1
        ? { text: `Un test verde che si chiama "${c.names[0]}" (basta che il nome contenga queste parole).`, example: `test("${c.names[0]}", () => { … })` }
        : {
            text: `${c.names.length} test verdi, uno per caso, con questi nomi: ${c.names.map((n) => `"${n}"`).join(", ")} (basta che il nome li contenga).`,
            example: `test("${c.names[0]}: …", () => { … })`,
          };
    case "file":
      return c.exports.length
        ? { text: `Il file ${c.path}, che esporta ${c.exports.join(", ")}.`, example: c.exports.map((e) => `export … ${e}`).join("\n") }
        : { text: `Il file ${c.path} (basta che esista).` };
    case "noErrors":
      return { text: `Nessun errore di TypeScript in ${c.path}: niente sottolineature rosse nell'editor.` };
    case "manual":
      return { text: "Lo spunti tu, quando ti sembra fatto." };
    case "invalid":
      return { text: `Questa condizione in percorso.md non la capisco: "${c.raw}". Scrivila come test "nome", file percorso, nessun errore in percorso oppure a mano.` };
  }
}

/** Riassunto breve accanto al titolo del compito: "3 test · 0 errori", "a mano". */
export function summarizeConditions(conditions: readonly Condition[]): string {
  if (conditions.length === 0) return "a mano";
  return conditions
    .map((c) => {
      switch (c.kind) {
        case "tests":
          return `${c.names.length} test`;
        case "file":
          return "file";
        case "noErrors":
          return "0 errori";
        case "manual":
          return "a mano";
        case "invalid":
          return "condizione da correggere";
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
  state?: { status: "done" | "open"; progress?: Progress; reason?: string; warning?: string };
}

export function buildViewModel(tasks: readonly Task[], states?: readonly TaskState[]): PathViewModel {
  const stateOf = new Map(tasks.map((t, i) => [t.line, states?.[i]] as const));
  const byStep = new Map<string, Task[]>();
  for (const t of tasks) {
    const name = t.step ?? "Senza passo";
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
        summary: summarizeConditions(t.conditions),
        when: (t.conditions.length ? t.conditions : [{ kind: "manual" } as const]).map((c) => ({
          text: describeCondition(c),
          invalid: c.kind === "invalid",
        })),
        expect: (t.conditions.length ? t.conditions : [{ kind: "manual" } as const]).map((c) => ({ ...explainCondition(c), invalid: c.kind === "invalid" })),
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
  return { state: { status: "open", reason: s.reason, ...(s.progress && { progress: s.progress }) } };
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
