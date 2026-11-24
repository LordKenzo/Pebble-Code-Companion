import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMapModel } from "../src/core/map";
import { parseDiary } from "../src/core/diary";
import { parsePath } from "../src/core/path";
import { parseRoadmap } from "../src/core/plan";

const ROADMAP = "1. Crea il progetto: deve partire.\n2. Descrivi con test le operazioni.\n3. Scrivi le operazioni.\n4. Costruisci il form.\n";
const PATH = [
  "## Passo 1 · Crea il progetto",
  "- [x] A", "  fatto quando: a mano",
  "## Step 2 · Descrivi con test",
  "- [x] B", "  done when: manual",
  "## Passo 3 · Scrivi le operazioni",
  "- [x] C", "  fatto quando: a mano",
  "- [ ] D", "  fatto quando: a mano",
].join("\n");
const DIARY = [
  "# Diario", "",
  "## Passo 3 · Scrivi le operazioni", "",
  "- 2026-11-24 10:12 · passo preparato: 2 compiti (proposta accettata)",
  '- 2026-11-24 10:31 · rosso "divide"',
  "- 2026-11-24 10:40 · fumetto calc.ts:9, gradino 2 · concetto: errori come valori",
  '- 2026-11-24 10:48 · verde "divide" (visto rosso prima)',
  "> Nota mia", "",
  "## Step 1 · Crea il progetto", "",
  "- 2026-11-23 09:52 · step prepared: 1 task (proposal accepted)",
].join("\n");

test("la mappa unisce roadmap, percorso misto e diario", () => {
  const m = buildMapModel(parseRoadmap(ROADMAP), parsePath(PATH).tasks, parseDiary(DIARY));
  assert.deepEqual(m.steps.map((s) => [s.n, s.state, `${s.done}/${s.total}`]), [
    [1, "done", "1/1"], [2, "done", "1/1"], [3, "current", "1/2"], [4, "future", "0/0"],
  ]);
  assert.equal(m.stepsDone, 2);
  assert.equal(m.tasksDone, 3);
  const s3 = m.steps[2]!;
  assert.deepEqual(s3.counts, { red: 1, green: 1, help: 1, concepts: 1 });
  assert.equal(s3.from, "2026-11-24");
  assert.deepEqual(s3.notes, ["> Nota mia"]);
  assert.equal(m.steps[0]!.entries.length, 1);
  assert.equal(m.steps[3]!.roadmap, "Costruisci il form.");
  assert.equal(m.steps[3]!.title, "Costruisci il form");
});

test("senza roadmap né diario la mappa usa le intestazioni del percorso", () => {
  const m = buildMapModel([], parsePath(PATH).tasks, []);
  assert.deepEqual(m.steps.map((s) => s.title), ["Crea il progetto", "Descrivi con test", "Scrivi le operazioni"]);
});
