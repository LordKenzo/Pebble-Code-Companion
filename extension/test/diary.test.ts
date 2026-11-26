import { test } from "node:test";
import assert from "node:assert/strict";
import { appendToDiary, formatEvent, parseDiary, stepNumber, taskEvents, testEvents } from "../src/core/diary";
import { parsePath } from "../src/core/path";

const at = (h: number, m: number) => new Date(2026, 10, 24, h, m);
const S3 = { n: 3, title: "Scrivi le operazioni" };

test("il primo evento crea il diario e la sezione del passo", () => {
  const md = appendToDiary(null, S3, at(10, 12), { kind: "stepPlanned", tasks: 4 });
  assert.equal(md, "# Diario\n\nLo scrive Pebble: piani accettati, test, fumetti, compiti, riletture. Puoi aggiungere note tue: Pebble non le tocca.\n\n## Passo 3 · Scrivi le operazioni\n\n- 2026-11-24 10:12 · passo preparato: 4 compiti (proposta accettata)\n");
});

test("gli eventi si accodano nella sezione, prima delle note dello sviluppatore", () => {
  let md = appendToDiary(null, S3, at(10, 12), { kind: "stepPlanned", tasks: 4 });
  md += "\n> Nota mia: occhio a 0 ÷ 0.\n";
  md = appendToDiary(md, S3, at(10, 31), { kind: "red", test: "divide: 0 ÷ 0" });
  md = appendToDiary(md, S3, at(10, 48), { kind: "green", test: "divide: 0 ÷ 0", seenRed: true });
  const [s] = parseDiary(md);
  assert.deepEqual(s!.entries.map((e) => e.time), ["10:12", "10:31", "10:48"]);
  assert.equal(s!.entries[2]!.text, 'verde "divide: 0 ÷ 0" (visto rosso prima)');
  assert.deepEqual(s!.notes, ["> Nota mia: occhio a 0 ÷ 0."]);
  assert.ok(md.indexOf("10:48") < md.indexOf("Nota mia"));
});

test("un passo nuovo va in alto; le sezioni si riconoscono in tutte e due le lingue", () => {
  let md = appendToDiary(null, { n: 2, title: "Test" }, at(9, 0), { kind: "stepClosed", done: 5, total: 5 }, "en");
  md = appendToDiary(md, S3, at(10, 0), { kind: "help", file: "calc.ts", line: 9, rung: 2, concept: "errors as values" }, "en");
  md = appendToDiary(md.replace("## Step 2", "## Passo 2"), { n: 2, title: "Test" }, at(11, 0), { kind: "taskReopened", title: "A" }, "en");
  const sections = parseDiary(md);
  assert.deepEqual(sections.map((s) => s.n), [3, 2]);
  assert.equal(sections[0]!.entries[0]!.text, "balloon calc.ts:9, rung 2 · concept: errors as values");
  assert.equal(sections[1]!.entries.length, 2);
});

test("stepNumber legge Passo e Step", () => {
  assert.equal(stepNumber("Passo 4 · Form"), 4);
  assert.equal(stepNumber("## Step 12 · X"), 12);
  assert.equal(stepNumber(null), null);
});

const PATH = "## Passo 3 · Op\n- [ ] Scrivi i test\n  fatto quando: test \"divide\"\n- [x] Rileggi\n  fatto quando: a mano\n";

test("eventi dei test: niente alla prima verifica, poi rosso e verde dopo il rosso, solo test citati", () => {
  const tasks = parsePath(PATH).tasks;
  const red = [{ name: "divide: 0 ÷ 0", ok: false }, { name: "altro", ok: false }];
  assert.deepEqual(testEvents(tasks, undefined, red, []), []);
  assert.deepEqual(testEvents(tasks, [], red, []).map((e) => e.event), [{ kind: "red", test: "divide: 0 ÷ 0" }]);
  assert.deepEqual(testEvents(tasks, red, red, []), [], "un rosso che resta rosso non è un evento nuovo");
  const green = [{ name: "divide: 0 ÷ 0", ok: true }];
  const ev = testEvents(tasks, red, green, ["divide: 0 ÷ 0"]);
  assert.deepEqual(ev, [{ event: { kind: "green", test: "divide: 0 ÷ 0", seenRed: true }, step: "Passo 3 · Op" }]);
});

test("eventi delle caselle e chiusura del passo", () => {
  const tasks = parsePath(PATH).tasks;
  const ev = taskEvents(tasks, [{ status: "done" }, { status: "unknown", reason: "a mano" }]);
  assert.deepEqual(ev.map((e) => e.event), [
    { kind: "taskDone", title: "Scrivi i test" },
    { kind: "stepClosed", done: 2, total: 2 },
  ]);
  assert.deepEqual(taskEvents(tasks, [{ status: "open", reason: "x" }, undefined]), []);
});

test("il codice scritto da Pebble su richiesta finisce nel diario (ADR-016)", () => {
  assert.equal(formatEvent({ kind: "code", where: "src/plates.ts:20" }, "it"), "codice scritto da Pebble su richiesta: src/plates.ts:20");
  assert.equal(formatEvent({ kind: "code", where: "src/plates.ts:20" }, "en"), "code written by Pebble on request: src/plates.ts:20");
  assert.equal(formatEvent({ kind: "code", where: "Api/Orders.cs", level: "entry" }, "it"), "codice scritto da Pebble su richiesta: Api/Orders.cs (livello entry)");
});
