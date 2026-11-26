import { parseTap, type ParsedTest } from "./tap";

/**
 * Legge i risultati dei test dei runner che non parlano TAP: Swift (XCTest e Swift Testing), pytest, Go e Cargo.
 * Si prova prima il TAP; se non c'è, il primo formato che trova dei test. Così funziona anche con un
 * pebble.path.testCommand scelto a mano. I nomi annidati usano " > ", come nel TAP: "SupportCoreTests > testExample".
 */
export function parseTestOutput(stdout: string, stderr = ""): ParsedTest[] {
  const tap = parseTap(stdout);
  if (tap.length) return tap;
  const all = `${stdout}\n${stderr}`;
  for (const parse of [parseSwift, parsePytest, parseGo, parseCargo]) {
    const tests = parse(all);
    if (tests.length) return tests;
  }
  return [];
}

const MAX_DETAIL = 600;
const clip = (s: string) => (s.length > MAX_DETAIL ? `${s.slice(0, MAX_DETAIL)}…` : s);
const lines = (s: string) => s.split(/\r?\n/);

function add(map: Map<string, ParsedTest>, name: string, ok: boolean): void {
  const prev = map.get(name);
  // Lo stesso nome due volte (per esempio XCTest e Swift Testing nella stessa esecuzione): basta un rosso.
  map.set(name, { name, ok: prev ? prev.ok && ok : ok });
}

function withDetails(map: Map<string, ParsedTest>, details: Map<string, string[]>): ParsedTest[] {
  return [...map.values()].map((t) => {
    const d = details.get(t.name);
    return !t.ok && d?.length ? { ...t, detail: clip(d.join("\n")) } : t;
  });
}

/**
 * swift test. XCTest: "Test Case '-[Mod.Classe testX]' passed (0.001 seconds)." (su Linux "'Classe.testX'"),
 * errori "File.swift:12: error: -[Mod.Classe testX] : XCTAssertEqual failed…".
 * Swift Testing: "✔ Test example() passed after 0.001 seconds.", "✘ Test \"Nome\" failed after…",
 * errori "✘ Test example() recorded an issue at File.swift:5:5: Expectation failed: …".
 */
export function parseSwift(out: string): ParsedTest[] {
  const map = new Map<string, ParsedTest>();
  const details = new Map<string, string[]>();
  const note = (name: string, text: string) => details.set(name, [...(details.get(name) ?? []), text.trim()]);
  const xcName = (raw: string) => {
    const m = /^-\[(?:[\w]+\.)?(\w+)\s+(\w+)\]$/.exec(raw) ?? /^(?:[\w]+\.)?(\w+)\.(\w+)$/.exec(raw);
    return m ? `${m[1]} > ${m[2]}` : raw;
  };
  const stName = (quoted: string | undefined, bare: string | undefined) => quoted ?? bare!.replace(/\(.*\)$/, "");
  for (const line of lines(out)) {
    const xc = /Test Case '([^']+)' (passed|failed)\b/.exec(line);
    if (xc) {
      add(map, xcName(xc[1]!), xc[2] === "passed");
      continue;
    }
    const xcErr = /:\d+: error: (-\[[^\]]+\]|[\w.]+) : (.*)$/.exec(line);
    if (xcErr) {
      note(xcName(xcErr[1]!), xcErr[2]!);
      continue;
    }
    const st = /^\s*\S+\s+Test (?:"([^"]+)"|(\S+?\(.*?\)))\s+(passed|failed|recorded an issue)\b(.*)$/.exec(line);
    if (!st) continue;
    const name = stName(st[1], st[2]);
    if (st[3] === "recorded an issue") note(name, st[4]!.replace(/^\s*at\s+\S+?:\d+(?::\d+)?:\s*/, ""));
    else add(map, name, st[3] === "passed");
  }
  return withDetails(map, details);
}

/** pytest -v: "tests/test_a.py::test_sum PASSED [ 50%]"; i motivi dal riepilogo "FAILED tests/test_a.py::test_sum - assert 1 == 2". */
export function parsePytest(out: string): ParsedTest[] {
  const map = new Map<string, ParsedTest>();
  const details = new Map<string, string[]>();
  const name = (id: string) => id.split("::").join(" > ");
  for (const line of lines(out)) {
    const r = /^(\S+\.py::\S+(?:\[[^\]]*\])?)\s+(PASSED|FAILED|ERROR|XPASS|XFAIL|SKIPPED)\b/.exec(line);
    if (r) {
      if (r[2] === "SKIPPED" || r[2] === "XFAIL") continue;
      add(map, name(r[1]!), r[2] === "PASSED" || r[2] === "XPASS");
      continue;
    }
    const s = /^(?:FAILED|ERROR) (\S+\.py::\S+) - (.*)$/.exec(line);
    if (s) details.set(name(s[1]!), [s[2]!]);
  }
  return withDetails(map, details);
}

/** go test -v: "--- PASS: TestSum (0.00s)", sottotest rientrati "--- FAIL: TestSum/zero"; i messaggi "sum_test.go:8: …". */
export function parseGo(out: string): ParsedTest[] {
  const map = new Map<string, ParsedTest>();
  const details = new Map<string, string[]>();
  const name = (id: string) => id.split("/").join(" > ");
  let current: string | null = null;
  for (const line of lines(out)) {
    const run = /^=== (?:RUN|CONT)\s+(\S+)/.exec(line);
    if (run) {
      current = name(run[1]!);
      continue;
    }
    const r = /^\s*--- (PASS|FAIL|SKIP): (\S+)/.exec(line);
    if (r) {
      if (r[1] !== "SKIP") add(map, name(r[2]!), r[1] === "PASS");
      continue;
    }
    const msg = /^\s+\S+_test\.go:\d+: (.*)$/.exec(line);
    if (msg && current) details.set(current, [...(details.get(current) ?? []), msg[1]!]);
  }
  return withDetails(map, details);
}

/** cargo test: "test tests::it_works ... ok"; i motivi dai blocchi "---- tests::it_works stdout ----". */
export function parseCargo(out: string): ParsedTest[] {
  const map = new Map<string, ParsedTest>();
  const details = new Map<string, string[]>();
  const name = (id: string) => id.split("::").join(" > ");
  let block: string | null = null;
  for (const line of lines(out)) {
    const r = /^test (\S+) \.\.\. (ok|FAILED|ignored)\b/.exec(line);
    if (r) {
      if (r[2] !== "ignored") add(map, name(r[1]!), r[2] === "ok");
      continue;
    }
    const head = /^---- (\S+) stdout ----$/.exec(line);
    if (head) {
      block = name(head[1]!);
      continue;
    }
    if (block && (/^failures:$/.test(line) || /^----/.test(line))) block = null;
    else if (block && line.trim() && !/^note: run with/.test(line)) details.set(block, [...(details.get(block) ?? []), line.trim()]);
  }
  return withDetails(map, details);
}
