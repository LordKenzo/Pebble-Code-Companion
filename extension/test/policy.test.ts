import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPolicy, stripLongCode } from "../src/core/policy";
import type { Review } from "../src/core/model";

test("lascia passare una firma di una riga", () => {
  const t = "Spunto:\n```ts\nfunction book(c: Course): Booking\n```";
  assert.deepEqual(stripLongCode(t), { text: t, removed: 0 });
});

test("lascia passare esattamente 3 righe, ignorando quelle vuote", () => {
  const t = "```\na\n\nb\nc\n```";
  assert.equal(stripLongCode(t).removed, 0);
});

test("rimuove un blocco di 4 righe", () => {
  const r = stripLongCode("prima\n```ts\nconst a = 1;\nlet b = 2;\nb = a;\nreturn b;\n```\ndopo");
  assert.equal(r.removed, 1);
  assert.match(r.text, /^prima\n\[Pebble ha rimosso/);
  assert.match(r.text, /dopo$/);
});

test("lascia passare un package.json completo (zona A)", () => {
  const t = '```json\n{\n  "name": "mini-calc",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n```';
  assert.equal(stripLongCode(t).removed, 0);
});

test("lascia passare una sequenza di comandi da terminale", () => {
  const t = "```sh\nnpm init -y\nnpm install -D typescript @types/node\nnpx tsc --init\nnpm test\n```";
  assert.equal(stripLongCode(t).removed, 0);
});

test("lascia passare un albero di cartelle senza linguaggio", () => {
  const t = "```\nsrc/\n├── core/\n│   └── plates.ts\n└── cli/\n    └── main.ts\n```";
  assert.equal(stripLongCode(t).removed, 0);
});

test("rimuove codice lungo in un blocco senza linguaggio", () => {
  const t = "```\nexport function plates(t: number) {\n  const x = t - 20;\n  return [x];\n}\n```";
  assert.equal(stripLongCode(t).removed, 1);
});

test("rimuove codice travestito da shell (heredoc o node -e)", () => {
  const heredoc = "```sh\ncat > src/plates.ts <<EOF\nexport function plates() {\n  return [];\n}\nEOF\n```";
  const evalCmd = "```bash\nnode -e '\nconst a = 1;\nconsole.log(a);\n'\n```";
  assert.equal(stripLongCode(heredoc).removed, 1);
  assert.equal(stripLongCode(evalCmd).removed, 1);
});

test("rimuove un blocco TypeScript lungo anche se il linguaggio ha attributi", () => {
  assert.equal(stripLongCode("```ts title=plates.ts\nconst a = 1;\nlet b = 2;\nb = a;\nreturn b;\n```").removed, 1);
});

test("lascia passare un blocco di sole dichiarazioni (zona B)", () => {
  const t = [
    "```ts",
    "export interface PlateLoad {",
    "  readonly total: Grams;",
    "  readonly perSide: readonly Grams[];",
    "}",
    "export type Result<T> =",
    "  | { ok: true; value: T }",
    "  | { ok: false; error: string };",
    "export function platesFor(total: Grams): Result<PlateLoad>;",
    "export class PgRepo implements Repo {",
    "  constructor(private readonly db: Pool) {}",
    "  run<T>(work: (repo: Repo) => Promise<T>): Promise<T>;",
    "}",
    "```",
  ].join("\n");
  assert.equal(stripLongCode(t).removed, 0);
});

test("rimuove un blocco TypeScript con un corpo, anche breve dentro le firme", () => {
  for (const bodyLine of ["  return [];", "  const rest = total - BAR;", "  if (total < BAR) {", "  x = 1;"]) {
    const t = ["```ts", "export type Grams = number;", "export function platesFor(total: Grams): Grams[] {", bodyLine, "}", "```"].join("\n");
    assert.equal(stripLongCode(t).removed, 1, bodyLine);
  }
});

test("rimuove un blocco di sole dichiarazioni oltre il limite di righe", () => {
  const lines = Array.from({ length: 21 }, (_, i) => `export type T${i} = number;`);
  assert.equal(stripLongCode(["```ts", ...lines, "```"].join("\n")).removed, 1);
});

test("conta ogni blocco lungo separatamente", () => {
  const long = "```ts\nconst a = 1;\nlet b = 2;\nb = a;\nreturn b;\n```";
  assert.equal(stripLongCode(`${long} e ${long}`).removed, 2);
});

const review = (n: number, text = "ok"): Review => ({
  summary: "s",
  notes: Array.from({ length: n }, (_, i) => ({
    severity: "info" as const, line: i + 1, endLine: null, anchor: "generale",
    problem: text, why: "w", try: "t",
  })),
  question: null,
  adrProposal: null,
});

test("tiene al massimo 3 note", () => {
  assert.equal(applyPolicy(review(5)).review.notes.length, 3);
});

test("filtra il codice anche dentro le note e conta le violazioni", () => {
  const r = applyPolicy(review(1, "```ts\nconst a = 1;\nlet b = 2;\nb = a;\nreturn b;\n```"));
  assert.equal(r.violations, 1);
  assert.match(r.review.notes[0].problem, /Pebble ha rimosso/);
});

test("le costanti dichiarate senza valore sono struttura, non codice", () => {
  const block = "```ts\nexport declare const BAR: Grams;\nexport declare const PLATES: readonly Grams[];\nexport interface PlateLoad {\n  readonly total: Grams;\n}\nexport function platesFor(total: Grams): PlateLoad;\n```";
  assert.equal(stripLongCode(block).removed, 0);
  assert.ok(stripLongCode("```ts\nconst a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\n```").removed > 0);
});
