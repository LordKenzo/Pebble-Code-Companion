import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHelpMessage, formatTests, historyLine, parseHelpAnswer, type HelpRequest } from "../src/core/help";

const base: HelpRequest = {
  ctx: { bootstrap: null, architecture: null, decisions: [{ name: "ADR-003", content: "Grammi interi" }] },
  level: "junior",
  file: { path: "src/core/plates.ts", content: "a\nb\nwhile (remaining > plate) {" },
  line: 3,
  ask: { kind: "rung", rung: 1 },
  history: [],
  task: { title: "Implementa platesFor", todo: "scorri i dischi", signature: "platesFor(total: Grams)", when: ['passano i test "60 kg"'] },
  tests: [
    { name: "20 kg: nessun disco", ok: true },
    { name: "60 kg: un 20 per lato", ok: false, detail: "Expected values to be strictly deep-equal:\n+   15,\n-   20" },
  ],
};

test("messaggio come negli eval: modo, gradino, ADR, compito, file numerato, cursore, test", () => {
  const m = buildHelpMessage(base);
  assert.ok(m.startsWith("MODE: HELP\nLEVEL: junior\nRUNG: 1"));
  assert.match(m, /<decisions>[\s\S]*ADR-003/);
  assert.match(m, /<task>\nImplementa platesFor\nfare: scorri i dischi\nfirma: platesFor\(total: Grams\)\nfatto quando: passano i test "60 kg"\n<\/task>/);
  assert.match(m, /<file path="src\/core\/plates.ts">\n1 \| a\n2 \| b\n3 \| while/);
  assert.match(m, /<cursor line="3">/);
  assert.ok(m.indexOf("<decisions>") < m.indexOf("<task>") && m.indexOf("<task>") < m.indexOf("<file") && m.indexOf("<file") < m.indexOf("<tests>"));
  assert.doesNotMatch(m, /<history>|<reply>|PERCHÉ|APPROFONDISCI/);
});

test("i test rossi vengono prima, con il motivo rientrato", () => {
  const t = formatTests(base.tests!);
  assert.equal(t.split("\n")[0], "✖ 60 kg: un 20 per lato");
  assert.equal(t.split("\n")[1], "    Expected values to be strictly deep-equal:");
  assert.match(t, /✔ 20 kg: nessun disco\nℹ tests 2 · pass 1 · fail 1$/);
});

test("risposta, perché e approfondimento hanno le loro righe", () => {
  const reply = buildHelpMessage({ ...base, ask: { kind: "reply", rung: 1, text: "il while salta l'uguaglianza" }, history: ["Gradino 1 · Domanda: perché salta il 20?"] });
  assert.match(reply, /RUNG: 1/);
  assert.match(reply, /<history>\nGradino 1 · Domanda: perché salta il 20\?\n<\/history>/);
  assert.match(reply, /<reply>\nil while salta l'uguaglianza\n<\/reply>/);
  assert.match(buildHelpMessage({ ...base, ask: { kind: "why", rung: 2 } }), /RUNG: 2\nWHY: yes/);
  assert.match(buildHelpMessage({ ...base, ask: { kind: "deep", rung: 1 } }), /DEEP_DIVE: yes/);
});

test("senza compito e senza test il messaggio resta valido", () => {
  const m = buildHelpMessage({ ...base, task: undefined, tests: undefined, level: "entry" });
  assert.doesNotMatch(m, /<task>|<tests>/);
  assert.match(m, /Entry level: plain words/);
});

test("separa la riga Concetto dal corpo", () => {
  const a = "**Gradino 2 · Direzione precisa**\nGuarda la riga 20.\n\n**Concetto:** errore di confine.";
  assert.deepEqual(parseHelpAnswer(a), { body: "**Gradino 2 · Direzione precisa**\nGuarda la riga 20.", concept: "errore di confine" });
  assert.deepEqual(parseHelpAnswer("**Gradino 1 · Domanda**\nPerché?"), { body: "**Gradino 1 · Domanda**\nPerché?", concept: null });
});

test("riassunto per la cronologia: titolo e testo, senza grassetti", () => {
  assert.equal(historyLine("**Gradino 1 · Domanda**\nCon 60 kg restano **20 000 g**: perché salta il 20?"), "Gradino 1 · Domanda: Con 60 kg restano 20 000 g: perché salta il 20?");
});
