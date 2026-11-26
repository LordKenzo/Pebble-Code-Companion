import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAssistMessage, insertPseudocode } from "../src/core/assist";

const CTX = { bootstrap: null, architecture: null, decisions: [{ name: "ADR-003", content: "Grammi interi." }] };

test("il messaggio di ASSIST porta la richiesta, la selezione e il livello", () => {
  const m = buildAssistMessage({ ctx: CTX, level: "entry", file: { path: "src/plates.ts", content: "a\nb\nc" }, ask: "explain", selection: { from: 2, to: 3 }, red: ["15 kg"], lang: "it" });
  assert.match(m, /^MODE: ASSIST\nLEVEL: entry\nASK: explain/);
  assert.match(m, /<file path="src\/plates\.ts">\n1 \| a/);
  assert.match(m, /<selection lines="2-3">/);
  assert.match(m, /<tests>\n✖ 15 kg\n<\/tests>/);
  assert.match(m, /Entry level: take almost nothing for granted/);
  const whole = buildAssistMessage({ ctx: CTX, level: "mid", file: { path: "a.ts", content: "x" }, ask: "study", lang: "en" });
  assert.match(whole, /<selection>none: the whole file<\/selection>/);
  assert.match(whole, /LANGUAGE: en/);
});

test("lo pseudocodice entra come commento nella funzione vuota, nella lingua del file", () => {
  const ts = "export function loadsFor(max: Grams, p: number[]) {\n  // TODO\n}\n";
  assert.equal(
    insertPseudocode(ts, "loadsFor", ["per ogni percentuale", "2. arrotonda per difetto"]),
    "export function loadsFor(max: Grams, p: number[]) {\n  // TODO(you)\n  // 1. per ogni percentuale\n  // 2. arrotonda per difetto\n  // TODO\n}\n",
  );
  const arrow = "const total = (xs: number[]): number => {\n};\n";
  assert.match(insertPseudocode(arrow, "total", ["somma"])!, /=> \{\n  \/\/ TODO\(you\)\n  \/\/ 1\. somma\n\};/);
  const py = "def apply_discount(order, percent):\n    pass\n";
  assert.equal(insertPseudocode(py, "apply_discount", ["cap at 50"]), "def apply_discount(order, percent):\n    # TODO(you)\n    # 1. cap at 50\n    pass\n");
  assert.equal(insertPseudocode(ts, "missing", ["x"]), null);
});
