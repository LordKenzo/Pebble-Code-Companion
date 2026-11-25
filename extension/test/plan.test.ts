import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlanMessage, insertStep, nextStep, parseRoadmap, planToSection, plannedStepNumbers, stepTitle, type PlanStep, buildPathMessage, pathTitle, appendSection } from "../src/core/plan";
import { parsePath } from "../src/core/path";

const ROADMAP_LIST = `# Roadmap

> Generato da Pebble.

1. **Setup**: package.json, tsconfig strict, script test e typecheck.
2. **Dischi per lato**: per un carico già componibile restituisce i dischi.
3. **Arrotondamento**: da un target qualsiasi al carico componibile per difetto.

## Da dove partire
Fai il passo 1.`;

const ROADMAP_TABLE = `| # | Passo | Fatto quando |
|---|---|---|
| 1 ✅ | **Casi di valutazione** del prompt | ok |
| 2 | Formato strutturato per REVIEW | ok |`;

test("roadmap con la numerazione doppia scritta dall'INIT: titoli leggibili", () => {
  const md = "1. 1. Impostare TypeScript e node:test; verificare che compilazione e un primo test passino (ADR-004).\n2. 2. Definire il contratto delle formule e verificare Epley, Brzycki e i limiti delle ripetizioni (ADR-002).";
  const steps = parseRoadmap(md);
  assert.deepEqual(steps.map((s) => [s.n, s.title]), [[1, "Impostare TypeScript e node:test"], [2, "Definire il contratto delle formule…"]]);
  assert.match(steps[1]!.text, /^Definire il contratto/);
});

test("legge la roadmap numerata e quella a tabella", () => {
  assert.deepEqual(parseRoadmap(ROADMAP_LIST).map((s) => [s.n, s.title]), [[1, "Setup"], [2, "Dischi per lato"], [3, "Arrotondamento"]]);
  assert.match(parseRoadmap(ROADMAP_LIST)[1]!.text, /^Dischi per lato: per un carico/);
  assert.deepEqual(parseRoadmap(ROADMAP_TABLE).map((s) => [s.n, s.title]), [[1, "Casi di valutazione"], [2, "Formato strutturato per REVIEW"]]);
});

const PATH_STEP1_DONE = "# Percorso\n\n## Passo 1 · Setup\n- [x] Installa\n- [x] Primo test\n";
const PATH_STEP1_OPEN = "# Percorso\n\n## Passo 1 · Setup\n- [x] Installa\n- [ ] Primo test\n";

test("il prossimo passo arriva solo quando quelli nel percorso sono chiusi", () => {
  const rm = parseRoadmap(ROADMAP_LIST);
  assert.equal(nextStep(rm, null)?.n, 1);
  assert.equal(nextStep(rm, PATH_STEP1_DONE)?.n, 2);
  assert.equal(nextStep(rm, PATH_STEP1_OPEN), null);
  assert.equal(nextStep(rm, PATH_STEP1_DONE + "## Passo 2 · Dischi\n- [x] a\n## Passo 3 · Arr\n- [x] b\n"), null);
  assert.deepEqual([...plannedStepNumbers(PATH_STEP1_OPEN)], [[1, { done: false }]]);
});

const plan: PlanStep = {
  reading: "Il setup c'è, manca plates.ts.",
  tasks: [
    { title: "Scrivi i test dei dischi", todo: "20, 22,5, 60 e 142,5 kg,\nprima i casi limite.", signature: null, doneWhen: ["file test/core/plates.test.ts"] },
    { title: "Implementa platesFor", todo: "grammi interi (ADR-003)", signature: "platesFor(total: Grams): Result<PlateLoad>", doneWhen: ['test "20 kg" "60 kg"', "nessun errore in src/core/plates.ts", "quando funziona"] },
    { title: "Rileggi con Pebble", todo: "review finale", signature: null, doneWhen: ["quando ti sembra fatto"] },
  ],
  question: null,
};
const step2 = parseRoadmap(ROADMAP_LIST)[1]!;

test("il piano diventa una sezione valida di percorso.md, senza condizioni scritte male", () => {
  const { markdown, dropped } = planToSection(plan, step2);
  assert.deepEqual(dropped, ["quando funziona", "quando ti sembra fatto"]);
  assert.equal(markdown.split("\n")[0], "## Passo 2 · Dischi per lato");
  assert.match(markdown, /  fare: 20, 22,5, 60 e 142,5 kg, prima i casi limite\./);
  const tasks = parsePath(markdown).tasks;
  assert.deepEqual(tasks.map((t) => [t.title, t.conditions.map((c) => c.kind)]), [
    ["Scrivi i test dei dischi", ["file"]],
    ["Implementa platesFor", ["tests", "noErrors"]],
    ["Rileggi con Pebble", ["manual"]],
  ]);
  assert.equal(tasks[1]!.signature, "platesFor(total: Grams): Result<PlateLoad>");
});

test("inserisce un passo nuovo in fondo, senza toccare il resto", () => {
  const out = insertStep(PATH_STEP1_DONE, planToSection(plan, step2).markdown, 2)!;
  assert.ok(out.startsWith(PATH_STEP1_DONE.trimEnd()));
  assert.match(out, /\n\n## Passo 2 · Dischi per lato\n- \[ \] Scrivi i test/);
});

test("senza percorso ne crea uno", () => {
  assert.equal(insertStep(null, "## Passo 1 · Setup\n- [ ] A\n", 1), "# Percorso\n\n## Passo 1 · Setup\n- [ ] A\n");
});

test("sostituisce un passo ancora tutto da fare, lasciando intatti gli altri", () => {
  const md = "# Percorso\n\n## Passo 2 · Vecchio\n- [ ] vecchio\n\n## Passo 3 · Dopo\n- [ ] c\n";
  const out = insertStep(md, "## Passo 2 · Nuovo\n- [ ] nuovo\n", 2)!;
  assert.equal(out, "# Percorso\n\n## Passo 2 · Nuovo\n- [ ] nuovo\n\n## Passo 3 · Dopo\n- [ ] c\n");
});

test("non tocca un passo con compiti già fatti", () => {
  assert.equal(insertStep(PATH_STEP1_OPEN, "## Passo 1 · Setup\n- [ ] altro\n", 1), null);
});

test("il messaggio contiene percorso, elenco dei file, contenuti e il passo da preparare", () => {
  const m = buildPlanMessage(
    { bootstrap: "# B", architecture: null, decisions: [] },
    step2,
    PATH_STEP1_DONE,
    [{ path: "package.json", content: '{ "name": "x" }' }, { path: "README.md" }],
    "junior",
  );
  assert.ok(m.startsWith("MODE: PLAN_STEP\nLEVEL: junior"));
  assert.match(m, /<path>\n# Percorso/);
  assert.match(m, /<files>\npackage.json\nREADME.md\n<\/files>/);
  assert.match(m, /<file path="package.json">\n1 \| \{ "name": "x" \}\n<\/file>/);
  assert.doesNotMatch(m, /<file path="README.md">/);
  assert.match(m, /STEP_TO_PREPARE: 2 · Dischi per lato\nDischi per lato: per un carico/);
});

test("titolo breve di un passo", () => {
  assert.equal(stepTitle("Setup"), "Setup");
  assert.equal(stepTitle("Dischi per lato: per un carico già componibile"), "Dischi per lato");
  assert.equal(stepTitle("Collegare i comandi `1rm` e `carichi`; verificare output"), "Collegare i comandi `1rm` e `carichi`");
});

test("in inglese: chiavi del percorso, titolo del passo e intestazione", () => {
  const { markdown } = planToSection(plan, step2, "en");
  assert.equal(markdown.split("\n")[0], "## Step 2 · Dischi per lato");
  assert.match(markdown, /\n  do: grammi interi/);
  assert.match(markdown, /\n  signature: platesFor/);
  assert.match(markdown, /\n  done when: manual\n$/);
  // il parser li rilegge: stesso percorso, in un'altra lingua
  assert.deepEqual(parsePath(markdown).tasks.map((t) => t.conditions.map((c) => c.kind)), [["file"], ["tests", "noErrors"], ["manual"]]);
  assert.equal(insertStep(null, markdown, 2, "en")!.split("\n")[0], "# Path");
  assert.equal(nextStep(parseRoadmap(ROADMAP_LIST), "# Path\n\n## Step 1 · Setup\n- [x] a\n")?.n, 2);
});

test("sentieri brevi: messaggio con PATH_TO_PREPARE, titolo, sezione in fondo", () => {
  const ctx = { bootstrap: null, architecture: null, decisions: [], roadmap: "0. Campo base ✅" };
  const m = buildPathMessage(ctx, "bug", "0,1 + 0,2 mostra\n 0.30000000000000004", "## Passo 0 · Campo base\n- [x] a\n", [], "junior", "it");
  assert.match(m, /^MODE: PLAN_STEP/);
  assert.match(m, /^PATH_TO_PREPARE: bug · 0,1 \+ 0,2 mostra 0\.30000000000000004$/m);
  assert.doesNotMatch(m, /STEP_TO_PREPARE/);
  assert.equal(pathTitle("Voglio un pulsante per copiare il risultato."), "Voglio un pulsante per copiare il risultato");
  const plan = { reading: "r", question: null, tasks: [{ title: "Scrivi il test che riproduce il bug", todo: "x", signature: null, doneWhen: ['test "add: 0,1 + 0,2"'] }] };
  const { markdown } = planToSection(plan, { n: 2, title: "Decimali", text: "" }, "it", "bug");
  assert.match(markdown, /^## Bug 2 · Decimali\n- \[ \] Scrivi il test/);
  assert.equal(appendSection("# Percorso\n\n## Passo 0 · Campo base\n- [x] a\n\n", markdown), "# Percorso\n\n## Passo 0 · Campo base\n- [x] a\n\n" + markdown);
  assert.match(appendSection(null, markdown, "en"), /^# Path\n\n## Bug 2/);
});
