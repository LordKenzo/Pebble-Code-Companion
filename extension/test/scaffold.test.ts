import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScaffoldMessage, composeScaffold, isTestFile, type Scaffold } from "../src/core/scaffold";

const plates: Scaffold = {
  imports: [
    { names: ["type Grams"], from: "./units.ts" },
    { names: ["ok", "type Result"], from: "./result.ts" },
  ],
  constants: [
    { name: "BAR", type: "Grams", value: "20_000", doc: "Il bilanciere, in grammi (ADR-003)" },
    { name: "PLATES", type: "readonly Grams[]", value: "[25_000, 20_000, 15_000, 10_000, 5_000, 2_500, 1_250]", doc: null },
  ],
  types: [{ doc: null, declaration: "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}" }],
  functions: [
    {
      doc: "Dischi per lato per un carico già componibile.",
      signature: "export function platesFor(total: Grams): Result<PlateLoad>",
      pseudocode: ["se total è sotto BAR → solo bilanciere, con avviso (ADR-004)", "resto per lato = (total − BAR) / 2", "per ogni disco, dal più pesante: finché ci sta, aggiungilo"],
      question: "Prima di scrivere: con 142,5 kg quali dischi ti aspetti?",
    },
  ],
  exampleTest: null,
  testCases: [],
};

test("compone lo scheletro come nel mockup: import, costanti, tipi, firma con pseudocodice e corpo vuoto", () => {
  const { text, dropped } = composeScaffold(plates, "src/core/plates.ts");
  assert.deepEqual(dropped, []);
  assert.equal(
    text,
    [
      'import { type Grams } from "./units.ts";',
      'import { ok, type Result } from "./result.ts";',
      "",
      "/** Il bilanciere, in grammi (ADR-003) */",
      "export const BAR: Grams = 20_000;",
      "export const PLATES: readonly Grams[] = [25_000, 20_000, 15_000, 10_000, 5_000, 2_500, 1_250];",
      "",
      "export interface PlateLoad {",
      "  readonly total: Grams;",
      "  readonly perSide: readonly Grams[];",
      "}",
      "",
      "/** Dischi per lato per un carico già componibile. */",
      "export function platesFor(total: Grams): Result<PlateLoad> {",
      "  // TODO(tu) Pseudocodice: trasformalo in codice, una riga alla volta.",
      "  // 1. se total è sotto BAR → solo bilanciere, con avviso (ADR-004)",
      "  // 2. resto per lato = (total − BAR) / 2",
      "  // 3. per ogni disco, dal più pesante: finché ci sta, aggiungilo",
      "  // ? Prima di scrivere: con 142,5 kg quali dischi ti aspetti?",
      "}",
      "",
    ].join("\n"),
  );
});

test("scarta ogni parte che contiene logica", () => {
  const bad: Scaffold = {
    ...plates,
    constants: [
      { name: "BAR", type: null, value: "20 * 1000", doc: null },
      { name: "TOTAL", type: null, value: "computeTotal()", doc: null },
      { name: "OK", type: null, value: '"kg"', doc: null },
    ],
    types: [{ doc: null, declaration: "export type F = (x: number) => { return x * 2 }" }],
    functions: [
      { doc: null, signature: "export function platesFor(total: Grams) { return []; }", pseudocode: [], question: null },
      { doc: null, signature: "export const platesFor = (t: Grams) => []", pseudocode: [], question: null },
      { doc: null, signature: "export function ok(t: Grams): boolean {}", pseudocode: ["controlla"], question: null },
    ],
  };
  const { text, dropped } = composeScaffold(bad, "src/core/plates.ts");
  assert.deepEqual(dropped, [
    "costante BAR",
    "costante TOTAL",
    "tipo: export type F = (x: number) => { return x * 2 }",
    "firma: export function platesFor(total: Grams) { return []; }",
    "firma: export const platesFor = (t: Grams) => []",
  ]);
  assert.match(text, /export const OK = "kg";/);
  assert.match(text, /export function ok\(t: Grams\): boolean \{\n  \/\/ TODO\(tu\)/);
  assert.doesNotMatch(text, /return/);
});

test("un commento non può chiudere il JSDoc né andare a capo", () => {
  const s: Scaffold = { ...plates, constants: [], types: [], functions: [{ ...plates.functions[0]!, doc: "a */ b\nc", pseudocode: ["uno\ndue"] }] };
  const { text } = composeScaffold(s, "src/x.ts");
  assert.match(text, /\/\*\* a \* \/ b c \*\//);
  assert.match(text, /\/\/ 1\. uno due/);
});

test("file di test: un solo test completo d'esempio, gli altri come test.todo", () => {
  const t: Scaffold = {
    imports: [
      { names: ["test"], from: "node:test" },
      { names: ["assert"], from: "node:assert/strict" },
      { names: ["platesFor"], from: "../../src/core/plates.ts" },
    ],
    constants: [],
    types: [],
    functions: [],
    exampleTest: { name: "20 kg: nessun disco", body: "const r = platesFor(20_000);\nassert.ok(r.ok);\nassert.deepEqual(r.value.perSide, []);" },
    testCases: ["15 kg: solo bilanciere con avviso", "60 kg: un 20 per lato"],
  };
  const { text, dropped } = composeScaffold(t, "test/core/plates.test.ts");
  assert.deepEqual(dropped, []);
  assert.match(text, /^import \{ test \} from "node:test";\nimport assert from "node:assert\/strict";/);
  assert.match(text, /test\("20 kg: nessun disco", \(\) => \{\n  const r = platesFor\(20_000\);\n  assert\.ok\(r\.ok\);\n  assert\.deepEqual\(r\.value\.perSide, \[\]\);\n\}\);/);
  assert.match(text, /test\.todo\("15 kg: solo bilanciere con avviso"\);\ntest\.todo\("60 kg: un 20 per lato"\);\n$/);
});

test("file di test: un esempio troppo lungo o con altri test dentro viene scartato", () => {
  const long: Scaffold = { ...plates, functions: [], constants: [], types: [], exampleTest: { name: "x", body: Array(14).fill("assert.ok(1);").join("\n") }, testCases: [] };
  assert.deepEqual(composeScaffold(long, "test/a.test.ts").dropped, ["test d'esempio troppo lungo o annidato"]);
  const nested: Scaffold = { ...long, exampleTest: { name: "x", body: 'test("altro", () => {});' } };
  assert.deepEqual(composeScaffold(nested, "test/a.test.ts").dropped, ["test d'esempio troppo lungo o annidato"]);
});

test("test fuori da un file di test vengono scartati", () => {
  const s: Scaffold = { ...plates, exampleTest: { name: "x", body: "assert.ok(1);" } };
  assert.ok(composeScaffold(s, "src/core/plates.ts").dropped.includes("test in un file che non è di test"));
  assert.doesNotMatch(composeScaffold(s, "src/core/plates.ts").text, /assert\.ok/);
});

test("riconosce i file di test", () => {
  for (const p of ["test/core/plates.test.ts", "src/a.spec.js", "tests/x.ts", "a_test.ts"]) assert.ok(isTestFile(p), p);
  for (const p of ["src/core/plates.ts", "src/testing.ts", "contest.ts"]) assert.ok(!isTestFile(p), p);
});

test("il messaggio dice quale file preparare e se è di test", () => {
  const m = buildScaffoldMessage({ bootstrap: null, architecture: null, decisions: [] }, "test/core/plates.test.ts", undefined, [{ path: "src/core/units.ts", content: "export type Grams = number;" }], "entry");
  assert.ok(m.startsWith("MODE: SCAFFOLD\nLIVELLO: entry"));
  assert.match(m, /<file path="src\/core\/units.ts">\n1 \| export type Grams = number;\n<\/file>/);
  assert.match(m, /FILE DA PREPARARE: test\/core\/plates.test.ts \(file di test\)/);
  assert.doesNotMatch(m, /FIRME PREVISTE/);
  const withSigs = buildScaffoldMessage({ bootstrap: null, architecture: null, decisions: [] }, "test/a.test.ts", undefined, [], "mid", ["platesFor(total: Grams): Result<PlateLoad>"]);
  assert.match(withSigs, /FIRME PREVISTE NEL PASSO:\n- platesFor\(total: Grams\): Result<PlateLoad>\nFILE DA PREPARARE/);
});
