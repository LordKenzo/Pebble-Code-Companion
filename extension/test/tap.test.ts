import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTap } from "../src/core/tap";

// Output reale di `node --test --test-reporter=tap` (Node 24), percorsi anonimizzati.
const NODE_TAP = readFileSync(join(__dirname, "..", "..", "test", "fixtures", "node-tap.txt"), "utf8");

test("output reale di node:test: solo i test veri, con il nome completo", () => {
  const r = parseTap(NODE_TAP);
  assert.deepEqual(
    r.map((t) => [t.name, t.ok]),
    [
      ["20 kg: nessun disco", true],
      ["60 kg: un 20 per lato", false],
      ["arrotondamento > 84,9 kg # diventa 82,5", true],
      ["arrotondamento > 85 kg resta 85", false],
    ],
  );
});

test("i test rossi portano il messaggio d'errore per il fumetto", () => {
  const r = parseTap(NODE_TAP);
  const plates = r.find((t) => t.name === "60 kg: un 20 per lato")!;
  assert.match(plates.detail!, /Expected values to be strictly deep-equal/);
  assert.match(plates.detail!, /\+   15,/);
  const round = r.find((t) => t.name.endsWith("85 kg resta 85"))!;
  assert.match(round.detail!, /84 !== 85/);
  assert.equal(r.find((t) => t.ok)!.detail, undefined);
});

test("suite, test saltati e todo non contano", () => {
  const names = parseTap(NODE_TAP).map((t) => t.name);
  assert.ok(!names.includes("arrotondamento"));
  assert.ok(!names.some((n) => n.includes("saltato") || n.includes("da fare")));
});

test("TAP generico senza Subtest e senza YAML (altri runner)", () => {
  const tap = ["TAP version 13", "1..3", "ok 1 - somma due numeri", "not ok 2 - divide per zero", "ok 3 # SKIP non su Windows", ""].join("\n");
  assert.deepEqual(parseTap(tap), [
    { name: "somma due numeri", ok: true },
    { name: "divide per zero", ok: false },
  ]);
});

test("aggiunge atteso e ricevuto quando l'errore non li mostra", () => {
  const tap = [
    "not ok 1 - carico 175 kg al 70%",
    "  ---",
    "  error: 'valore sbagliato'",
    "  expected: 122.5",
    "  actual: 120",
    "  ...",
  ].join("\n");
  assert.deepEqual(parseTap(tap), [{ name: "carico 175 kg al 70%", ok: false, detail: "valore sbagliato\natteso 122.5, ricevuto 120" }]);
});

test("fine riga Windows e output vuoto", () => {
  assert.deepEqual(parseTap("ok 1 - a\r\nnot ok 2 - b\r\n"), [{ name: "a", ok: true }, { name: "b", ok: false }]);
  assert.deepEqual(parseTap(""), []);
  assert.deepEqual(parseTap("Error: Cannot find module './plates.ts'"), []);
});

test("un messaggio d'errore lunghissimo viene accorciato", () => {
  const tap = ["not ok 1 - x", "  ---", "  error: |-", ...Array.from({ length: 80 }, (_, i) => `    riga ${i} ${"x".repeat(20)}`), "  ...", ""].join("\n");
  const [t] = parseTap(tap);
  assert.ok(t!.detail!.length <= 601);
  assert.ok(t!.detail!.endsWith("…"));
});
