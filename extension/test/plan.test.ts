import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlanMessage, insertStep, nextStep, parseRoadmap, planToSection, plannedStepNumbers, type PlanStep } from "../src/core/plan";
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
  assert.ok(m.startsWith("MODE: PLAN_STEP\nLIVELLO: junior"));
  assert.match(m, /<percorso>\n# Percorso/);
  assert.match(m, /<files>\npackage.json\nREADME.md\n<\/files>/);
  assert.match(m, /<file path="package.json">\n1 \| \{ "name": "x" \}\n<\/file>/);
  assert.doesNotMatch(m, /<file path="README.md">/);
  assert.match(m, /PASSO DA PREPARARE: 2 · Dischi per lato\nDischi per lato: per un carico/);
});
