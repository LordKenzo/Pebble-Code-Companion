import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyStates, buildViewModel, describeCondition, evaluate, findExports, parseCondition, parsePath, summarizeConditions, testNameMatches, withCheckbox,
  updateSeenRed, type Signals,
} from "../src/core/path";

const PERCORSO = [
  "# Percorso",
  "",
  "Note libere che Pebble non tocca.",
  "",
  "## Passo 2 · Dischi per lato",
  "- [x] Scrivi i test dei dischi",
  "  fatto quando: test \"20 kg\" \"22,5 kg\" \"60 kg\"",
  "- [ ] Crea src/core/plates.ts",
  "  fare: livello core, grammi interi (ADR-003)",
  "  fatto quando: file src/core/plates.ts esporta platesFor",
  "- [ ] Implementa platesFor",
  "  fare: togli il bilanciere, dividi per due, scorri i dischi",
  "  firma: platesFor(total: Grams): Result<PlateLoad>",
  "  priorità: alta",
  "  fatto quando: test \"20 kg\" \"22,5 kg\" \"60 kg\"",
  "  fatto quando: nessun errore in src/core/plates.ts",
  "- [ ] Rileggi con Pebble",
  "  fatto quando: a mano",
  "",
  "## Passo 3 · Arrotondamento",
  "- [ ] Arrotonda per difetto",
].join("\n");

const doc = parsePath(PERCORSO);
const task = (title: string) => {
  const t = doc.tasks.find((x) => x.title === title);
  assert.ok(t, `compito mancante: ${title}`);
  return t;
};

// ---------- parsing ----------

test("legge compiti, passi, caselle e campi", () => {
  assert.equal(doc.tasks.length, 5);
  const impl = task("Implementa platesFor");
  assert.equal(impl.step, "Passo 2 · Dischi per lato");
  assert.equal(impl.checked, false);
  assert.equal(impl.todo, "togli il bilanciere, dividi per due, scorri i dischi");
  assert.equal(impl.signature, "platesFor(total: Grams): Result<PlateLoad>");
  assert.deepEqual(impl.conditions, [
    { kind: "tests", names: ["20 kg", "22,5 kg", "60 kg"] },
    { kind: "noErrors", path: "src/core/plates.ts" },
  ]);
  assert.equal(task("Scrivi i test dei dischi").checked, true);
  assert.equal(task("Arrotonda per difetto").step, "Passo 3 · Arrotondamento");
});

test("un compito senza condizioni ha zero condizioni (si spunta a mano)", () => {
  assert.deepEqual(task("Arrotonda per difetto").conditions, []);
});

test("le chiavi sconosciute vengono ignorate senza rompere il compito", () => {
  // "priorità: alta" sta in mezzo ai campi di "Implementa platesFor"
  assert.equal(task("Implementa platesFor").conditions.length, 2);
});

test("accetta anche le chiavi in inglese e la casella maiuscola", () => {
  const d = parsePath("- [X] Task\n  do: something\n  signature: f(): void\n  done when: manual");
  assert.deepEqual(d.tasks[0], {
    line: 0, title: "Task", checked: true, step: null, todo: "something", signature: "f(): void", conditions: [{ kind: "manual" }],
  });
});

test("un campo dopo testo libero non rientrato non si attacca al compito precedente", () => {
  const d = parsePath("- [ ] A\nTesto libero\n  fatto quando: a mano");
  assert.deepEqual(d.tasks[0]!.conditions, []);
});

test("condizioni: tutte le forme riconosciute", () => {
  assert.deepEqual(parseCondition('test "a" «b c»'), { kind: "tests", names: ["a", "b c"] });
  assert.deepEqual(parseCondition("file src/x.ts"), { kind: "file", path: "src/x.ts", exports: [] });
  assert.deepEqual(parseCondition("file src/x.ts esporta a, b"), { kind: "file", path: "src/x.ts", exports: ["a", "b"] });
  assert.deepEqual(parseCondition("no errors in src/x.ts"), { kind: "noErrors", path: "src/x.ts" });
  assert.deepEqual(parseCondition("A mano"), { kind: "manual" });
  assert.deepEqual(parseCondition("quando ho voglia"), { kind: "invalid", raw: "quando ho voglia" });
  assert.deepEqual(parseCondition("test senza virgolette"), { kind: "invalid", raw: "test senza virgolette" });
});

// ---------- nomi dei test ----------

test("il nome cercato deve comparire come parola intera", () => {
  assert.ok(testNameMatches("20 kg: nessun disco", "20 kg"));
  assert.ok(testNameMatches("plates > 60 kg: un 20 per lato", "60 kg"));
  assert.ok(testNameMatches("22,5 KG: un 1,25 per lato", "22,5 kg"));
  assert.ok(!testNameMatches("120 kg: 25 + 25", "20 kg"));
  assert.ok(!testNameMatches("22,5 kg: un 1,25 per lato", "5 kg"));
  assert.ok(!testNameMatches("22.5 kg", "22"));
  assert.ok(!testNameMatches("platesForAll", "platesFor"));
});

// ---------- valutazione ----------

const greenTests = [
  { name: "20 kg: nessun disco", ok: true },
  { name: "22,5 kg: un 1,25 per lato", ok: true },
  { name: "60 kg: un 20 per lato", ok: true },
];
const allGood: Signals = {
  tests: greenTests,
  files: { "src/core/plates.ts": ["platesFor", "BAR"] },
  errors: { "src/core/plates.ts": 0 },
};
const stateOf = (title: string, s: Signals) => evaluate(doc.tasks, s)[doc.tasks.indexOf(task(title))]!;

test("test verdi, file esportato e nessun errore: compito fatto", () => {
  assert.deepEqual(stateOf("Implementa platesFor", allGood), { status: "done", progress: { passed: 3, total: 3 } });
  assert.deepEqual(stateOf("Crea src/core/plates.ts", allGood), { status: "done" });
});

test("un test che torna rosso riapre il compito, con il progresso", () => {
  const s: Signals = { ...allGood, tests: [greenTests[0]!, greenTests[1]!, { name: "60 kg: un 20 per lato", ok: false }] };
  assert.deepEqual(stateOf("Implementa platesFor", s), {
    status: "open", reason: 'test rosso: "60 kg"', progress: { passed: 2, total: 3 },
  });
  // il compito era spuntato nel file, ma i segnali vincono
  assert.equal(stateOf("Scrivi i test dei dischi", s).status, "open");
});

test("un test che non esiste lascia il compito aperto e lo dice", () => {
  const s: Signals = { ...allGood, tests: greenTests.slice(0, 2) };
  assert.deepEqual(stateOf("Implementa platesFor", s), {
    status: "open", reason: 'test non trovato: "60 kg"', progress: { passed: 2, total: 3 },
  });
});

test("file mancante o senza l'esportazione: aperto", () => {
  assert.deepEqual(stateOf("Crea src/core/plates.ts", { ...allGood, files: {} }), { status: "open", reason: "manca src/core/plates.ts" });
  assert.deepEqual(stateOf("Crea src/core/plates.ts", { ...allGood, files: { "src/core/plates.ts": ["BAR"] } }), {
    status: "open", reason: "src/core/plates.ts non esporta platesFor",
  });
});

test("errori del compilatore: aperto, anche se i test sono verdi", () => {
  assert.deepEqual(stateOf("Implementa platesFor", { ...allGood, errors: { "src/core/plates.ts": 2 } }), {
    status: "open", reason: "2 errori in src/core/plates.ts", progress: { passed: 3, total: 3 },
  });
});

test("compito a mano o senza condizioni: si decide dalla casella", () => {
  assert.equal(stateOf("Rileggi con Pebble", allGood).status, "unknown");
  assert.equal(stateOf("Arrotonda per difetto", allGood).status, "unknown");
});

test("segnali mancanti vogliono dire 'non so', non 'falso'", () => {
  assert.deepEqual(stateOf("Implementa platesFor", {}), { status: "unknown", reason: "test non ancora lanciati" });
  // ma una condizione falsa basta ad aprire, anche se un'altra è sconosciuta
  assert.equal(stateOf("Implementa platesFor", { files: {}, errors: {} }).status, "open");
});

test("una condizione non riconosciuta non spunta né apre il compito", () => {
  const d = parsePath("- [ ] A\n  fatto quando: quando ho voglia");
  assert.deepEqual(evaluate(d.tasks, allGood), [{ status: "unknown", reason: "condizione non riconosciuta: quando ho voglia" }]);
});

// ---------- prima rosso, poi verde (ADR-010) ----------

test("verde senza mai essere stato rosso: fatto, ma con un avviso", () => {
  const s: Signals = { ...allGood, seenRed: ["20 kg: nessun disco", "22,5 kg: un 1,25 per lato"] };
  const st = stateOf("Implementa platesFor", s);
  assert.equal(st.status, "done");
  assert.ok(st.status === "done" && st.warning?.includes('"60 kg"'));
  assert.ok(st.status === "done" && !st.warning?.includes('"20 kg"'));
});

test("visto rosso e poi verde: fatto, senza avviso", () => {
  const s: Signals = { ...allGood, seenRed: greenTests.map((t) => t.name) };
  assert.deepEqual(stateOf("Implementa platesFor", s), { status: "done", progress: { passed: 3, total: 3 } });
});

test("con requireRedFirst un test mai visto rosso tiene aperto il compito", () => {
  const s: Signals = { ...allGood, seenRed: [] };
  const st = evaluate(doc.tasks, s, { requireRedFirst: true })[doc.tasks.indexOf(task("Implementa platesFor"))]!;
  assert.equal(st.status, "open");
  assert.ok(st.status === "open" && st.reason.startsWith("verde, ma non l'ho mai visto fallire"));
});

test("senza cronologia (seenRed assente) nessun avviso", () => {
  const st = stateOf("Implementa platesFor", allGood);
  assert.ok(st.status === "done" && st.warning === undefined);
});

test("updateSeenRed aggiunge solo i rossi nuovi, una volta", () => {
  const prev = ["a"];
  const next = updateSeenRed(prev, [{ name: "a", ok: false }, { name: "b", ok: false }, { name: "c", ok: true }, { name: "b", ok: false }]);
  assert.deepEqual(next, ["a", "b"]);
  assert.deepEqual(prev, ["a"]);
});

test("il modello della vista porta lo stato dei compiti", () => {
  const red: Signals = { ...allGood, tests: [greenTests[0]!, greenTests[1]!, { name: "60 kg: un 20 per lato", ok: false }] };
  const m = buildViewModel(doc.tasks, evaluate(doc.tasks, red));
  const impl = m.steps[0]!.tasks.find((t) => t.title === "Implementa platesFor")!;
  assert.deepEqual(impl.state, { status: "open", reason: 'test rosso: "60 kg"', progress: { passed: 2, total: 3 } });
  assert.equal(m.steps[0]!.tasks.find((t) => t.title === "Rileggi con Pebble")!.state, undefined);
});

// ---------- aggiornamento del file ----------

test("aggiorna solo le caselle cambiate e lascia il resto identico", () => {
  const states = evaluate(doc.tasks, allGood);
  const { text, changed } = applyStates(PERCORSO, doc.tasks, states);
  assert.equal(changed, 2); // "Crea" e "Implementa"; "Scrivi i test" era già spuntato
  const before = PERCORSO.split("\n");
  const after = text.split("\n");
  assert.equal(after.length, before.length);
  const diff = after.map((l, i) => (l !== before[i] ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(diff, [task("Crea src/core/plates.ts").line, task("Implementa platesFor").line]);
  assert.equal(after[task("Implementa platesFor").line], "- [x] Implementa platesFor");
});

test("toglie la spunta quando un test torna rosso", () => {
  const red: Signals = { ...allGood, tests: greenTests.map((t) => ({ ...t, ok: false })) };
  const { text } = applyStates(PERCORSO, doc.tasks, evaluate(doc.tasks, red));
  assert.match(text, /^- \[ \] Scrivi i test dei dischi$/m);
});

test("non tocca le caselle dei compiti a mano", () => {
  const checked = PERCORSO.replace("- [ ] Rileggi con Pebble", "- [x] Rileggi con Pebble");
  const d = parsePath(checked);
  assert.equal(applyStates(checked, d.tasks, evaluate(d.tasks, allGood)).text.includes("- [x] Rileggi con Pebble"), true);
});

test("se il file è cambiato nel frattempo, non scrive sulla riga sbagliata", () => {
  const shifted = "Riga aggiunta in cima\n" + PERCORSO;
  const { text, changed } = applyStates(shifted, doc.tasks, evaluate(doc.tasks, allGood));
  assert.equal(changed, 0);
  assert.equal(text, shifted);
});

test("conserva i fine riga Windows", () => {
  const crlf = PERCORSO.replace(/\n/g, "\r\n");
  const d = parsePath(crlf);
  const { text } = applyStates(crlf, d.tasks, evaluate(d.tasks, allGood));
  assert.equal(text.split("\r\n").length, PERCORSO.split("\n").length);
  assert.match(text, /- \[x\] Implementa platesFor\r\n/);
});

test("withCheckbox cambia solo la casella e rifiuta righe che non sono compiti", () => {
  assert.equal(withCheckbox("  - [ ] Implementa platesFor", true), "  - [x] Implementa platesFor");
  assert.equal(withCheckbox("* [X] A [ ] dentro il titolo", false), "* [ ] A [ ] dentro il titolo");
  assert.equal(withCheckbox("## Passo 2", true), null);
  assert.equal(withCheckbox(undefined, true), null);
});

// ---------- testi per la vista ----------

test("descrive e riassume le condizioni", () => {
  const impl = task("Implementa platesFor");
  assert.deepEqual(impl.conditions.map(describeCondition), ['passano i test "20 kg", "22,5 kg", "60 kg"', "nessun errore in src/core/plates.ts"]);
  assert.equal(summarizeConditions(impl.conditions), "3 test · 0 errori");
  assert.equal(summarizeConditions([]), "a mano");
  assert.equal(describeCondition({ kind: "file", path: "a.ts", exports: [] }), "esiste a.ts");
  assert.equal(summarizeConditions([{ kind: "invalid", raw: "boh" }]), "condizione da correggere");
});

// ---------- modello per la vista ----------

test("modello: passo corrente, compito attivo, ADR citati e conteggi", () => {
  const m = buildViewModel(doc.tasks);
  assert.equal(m.total, 5);
  assert.equal(m.done, 1);
  assert.equal(m.currentStep, 0);
  const step = m.steps[0]!;
  assert.equal(step.name, "Passo 2 · Dischi per lato");
  assert.deepEqual(step.refs, ["ADR-003"]);
  assert.deepEqual([step.done, step.total], [1, 4]);
  assert.deepEqual(step.tasks.filter((t) => t.current).map((t) => t.title), ["Crea src/core/plates.ts"]);
  assert.equal(m.steps[1]!.tasks.some((t) => t.current), false);
  const impl = step.tasks.find((t) => t.title === "Implementa platesFor")!;
  assert.deepEqual(impl.when, [
    { text: 'passano i test "20 kg", "22,5 kg", "60 kg"', invalid: false },
    { text: "nessun errore in src/core/plates.ts", invalid: false },
  ]);
  assert.deepEqual(step.tasks.find((t) => t.title === "Rileggi con Pebble")!.when, [{ text: "a mano", invalid: false }]);
});

test("modello: il passo corrente è il primo con compiti da fare", () => {
  const all = PERCORSO.replace(/- \[ \] (Crea|Implementa|Rileggi)/g, "- [x] $1");
  const m = buildViewModel(parsePath(all).tasks);
  assert.equal(m.currentStep, 1);
  assert.equal(m.steps[1]!.tasks[0]!.current, true);
});

test("modello: tutto fatto mostra l'ultimo passo, percorso vuoto non si rompe", () => {
  const m = buildViewModel(parsePath(PERCORSO.replace(/- \[ \]/g, "- [x]")).tasks);
  assert.equal(m.currentStep, 1);
  assert.equal(m.steps.flatMap((s) => s.tasks).some((t) => t.current), false);
  assert.deepEqual(buildViewModel([]), { done: 0, total: 0, currentStep: 0, steps: [] });
});

// ---------- esportazioni ----------

test("trova le esportazioni di un file TypeScript", () => {
  const src = [
    "export const BAR: Grams = 20_000;",
    "export interface PlateLoad { total: Grams }",
    "export type Grams = number;",
    "export async function platesFor(total: Grams) {}",
    "export default class Calculator {}",
    "export { helper, other as renamed, type Shape };",
    "const hidden = 1;",
  ].join("\n");
  assert.deepEqual(findExports(src).sort(), ["BAR", "Calculator", "Grams", "PlateLoad", "Shape", "helper", "platesFor", "renamed"].sort());
});
