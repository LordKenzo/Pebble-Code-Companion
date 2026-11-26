import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTestOutput } from "../src/core/testOutput";
import { detectTestCommand } from "../src/core/runner";
import { testNameMatches } from "../src/core/path";

test("swift test con XCTest (macOS e Linux), anche con i risultati su stderr", () => {
  const err = [
    "Test Suite 'All tests' started at 2026-11-26 10:00:00.000.",
    "Test Case '-[SupportCoreTests.SupportCoreTests testExample]' started.",
    "Test Case '-[SupportCoreTests.SupportCoreTests testExample]' passed (0.001 seconds).",
    "/p/Tests/SupportCoreTests/CallTests.swift:12: error: -[SupportCoreTests.CallTests testEmptyName] : XCTAssertThrowsError failed: did not throw an error",
    "Test Case '-[SupportCoreTests.CallTests testEmptyName]' failed (0.002 seconds).",
    "Test Case 'CallTests.testFuture' passed (0.000 seconds)",
    "Test Suite 'All tests' failed at 2026-11-26 10:00:00.010.",
  ].join("\n");
  const r = parseTestOutput("Building for debugging...\nBuild complete!", err);
  assert.deepEqual(r.map((t) => [t.name, t.ok]), [["SupportCoreTests > testExample", true], ["CallTests > testEmptyName", false], ["CallTests > testFuture", true]]);
  assert.match(r[1]!.detail!, /did not throw/);
  assert.ok(testNameMatches(r[0]!.name, "testExample"));
});

test("swift test con Swift Testing: nomi semplici e nomi descrittivi", () => {
  const out = [
    "◇ Test run started.",
    "◇ Test example() started.",
    "✔ Test example() passed after 0.001 seconds.",
    '✘ Test "Una chiamata senza nome non è valida" recorded an issue at CallTests.swift:9:5: Expectation failed: (error → nil) != nil',
    '✘ Test "Una chiamata senza nome non è valida" failed after 0.002 seconds with 1 issue.',
    "✘ Suite CallTests failed after 0.003 seconds with 1 issue.",
    "✘ Test run with 2 tests failed after 0.003 seconds with 1 issue.",
  ].join("\n");
  const r = parseTestOutput(out);
  assert.deepEqual(r.map((t) => [t.name, t.ok]), [["example", true], ["Una chiamata senza nome non è valida", false]]);
  assert.match(r[1]!.detail!, /^Expectation failed/);
});

test("pytest -v, con il motivo dal riepilogo", () => {
  const out = [
    "tests/test_calc.py::test_sum PASSED                                   [ 33%]",
    "tests/test_calc.py::TestDiv::test_zero FAILED                         [ 66%]",
    "tests/test_calc.py::test_skip SKIPPED (todo)                          [100%]",
    "=========================== short test summary info ============================",
    "FAILED tests/test_calc.py::TestDiv::test_zero - ZeroDivisionError: division by zero",
  ].join("\n");
  const r = parseTestOutput(out);
  assert.deepEqual(r.map((t) => [t.name, t.ok]), [["tests/test_calc.py > test_sum", true], ["tests/test_calc.py > TestDiv > test_zero", false]]);
  assert.equal(r[1]!.detail, "ZeroDivisionError: division by zero");
});

test("go test -v, con i sottotest e i messaggi", () => {
  const out = [
    "=== RUN   TestSum",
    "=== RUN   TestSum/zero",
    "    sum_test.go:14: got 1, want 0",
    "--- FAIL: TestSum (0.00s)",
    "    --- FAIL: TestSum/zero (0.00s)",
    "=== RUN   TestDiv",
    "--- PASS: TestDiv (0.00s)",
    "FAIL",
  ].join("\n");
  const r = parseTestOutput(out);
  assert.deepEqual(r.map((t) => [t.name, t.ok]), [["TestSum", false], ["TestSum > zero", false], ["TestDiv", true]]);
  assert.equal(r[1]!.detail, "got 1, want 0");
});

test("cargo test, con il blocco del fallimento", () => {
  const out = [
    "running 3 tests",
    "test tests::it_works ... ok",
    "test tests::it_fails ... FAILED",
    "test tests::slow ... ignored",
    "",
    "failures:",
    "",
    "---- tests::it_fails stdout ----",
    "thread 'tests::it_fails' panicked at src/lib.rs:10:9:",
    "assertion `left == right` failed",
    "note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace",
    "",
    "failures:",
    "    tests::it_fails",
  ].join("\n");
  const r = parseTestOutput(out);
  assert.deepEqual(r.map((t) => [t.name, t.ok]), [["tests > it_works", true], ["tests > it_fails", false]]);
  assert.match(r[1]!.detail!, /assertion `left == right` failed/);
});

test("il TAP ha la precedenza, e niente risultati vuol dire lista vuota", () => {
  assert.deepEqual(parseTestOutput("ok 1 - somma\n1..1").map((t) => t.name), ["somma"]);
  assert.deepEqual(parseTestOutput("hello\nworld"), []);
});

test("senza package.json il comando viene dal manifest dello stack", () => {
  const cmd = (others: string[], win = false) => { const r = detectTestCommand(null, "it", others, win); return r.kind === "command" ? r.command : r.hint; };
  assert.equal(cmd(["Package.swift"]), "swift test");
  assert.equal(cmd(["go.mod"]), "go test -v ./...");
  assert.equal(cmd(["Cargo.toml"]), "cargo test");
  assert.equal(cmd(["requirements.txt"]), "python3 -m pytest -v");
  assert.equal(cmd(["pyproject.toml"], true), "python -m pytest -v");
  assert.equal(cmd([]), "node --test --test-reporter=tap");
  // Con un package.json vince Node, come prima.
  const r = detectTestCommand(JSON.stringify({ devDependencies: { vitest: "3" } }), "it", ["Package.swift"]);
  assert.equal(r.kind === "command" && r.runner, "Vitest");
});
