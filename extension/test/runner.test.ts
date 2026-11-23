import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TEST_COMMAND, detectTestCommand, packageDependencies } from "../src/core/runner";

const pkg = (o: object) => JSON.stringify(o);

test("Vitest: il reporter TAP piatto", () => {
  assert.deepEqual(detectTestCommand(pkg({ devDependencies: { vitest: "^3" } })), { kind: "command", command: "npx vitest run --reporter=tap-flat", runner: "Vitest" });
});

test("progetto web senza test runner: lo dice, invece di lanciare node --test a vuoto", () => {
  const r = detectTestCommand(pkg({ dependencies: { react: "^19" }, devDependencies: { vite: "^8" } }));
  assert.equal(r.kind, "missing");
  assert.match(r.kind === "missing" ? r.hint : "", /npm install -D vitest/);
});

test("Node puro o script con node --test: il comando di default", () => {
  assert.equal(detectTestCommand(pkg({ scripts: { test: "node --test tests/*.test.ts" }, devDependencies: { typescript: "^7" } })).kind, "command");
  assert.deepEqual(detectTestCommand(null), { kind: "command", command: DEFAULT_TEST_COMMAND, runner: "node:test" });
  assert.deepEqual(detectTestCommand("{ rotto"), { kind: "command", command: DEFAULT_TEST_COMMAND, runner: "node:test" });
});

test("Jest: serve un reporter TAP", () => {
  assert.equal(detectTestCommand(pkg({ devDependencies: { jest: "^30" } })).kind, "missing");
});

test("dipendenze dal package.json", () => {
  assert.deepEqual(packageDependencies(pkg({ dependencies: { react: "1" }, devDependencies: { vitest: "3" } })), ["react", "vitest"]);
  assert.equal(packageDependencies(null), undefined);
  assert.equal(packageDependencies("rotto"), undefined);
});
