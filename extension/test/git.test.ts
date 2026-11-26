import { test } from "node:test";
import assert from "node:assert/strict";
import { buildState, needsAttention, nextSteps, parseConflicts, parseStatusV2, pickCards, resolveBlock, sideNames } from "../src/core/git";

// Output vero di git 2.4x, da un repository di prova con un rebase in conflitto.
const REBASE_STATUS = `# branch.oid 13fae39143d32341214a931025a5009468ad7658
# branch.head (detached)
u UU N... 100644 100644 100644 100644 e568cdf0d4d604617ba708f2a1a570c3815aa7d8 4a0f1d0d1d4d00b3064eaaa101883026c127da65 5c6e9121546a48b1da714ea01bbe6f4b5be90cdf plates.test.ts
u UU N... 100644 100644 100644 100644 749167df5692d6865a6ea95aa072d6d2ea083ddf 523ec6edf2bc96f76e08a627fb9d93492629112b f5c081cbb0a792b35a6fd2a8379c39a9bd25b1ab src/core/my plates.ts
`;
const AHEAD_STATUS = `# branch.oid 60c56def753b567bcf52ed8ef0ec59c71d972e1f
# branch.head feature/arrotonda
# branch.upstream origin/feature/arrotonda
# branch.ab +1 -2
`;
const PLATES = `<<<<<<< HEAD
export function platesFor(total, plates = PLATES) {
  if (total < BAR) return ok([]);
  return go(total, plates);
=======
export function platesFor(total) {
  const load = roundDown(total);
  if (load < BAR) return ok([]);
  return go(load);
>>>>>>> f592fca (Arrotonda il carico per difetto)
}`;

test("git status v2: ramo, upstream, avanti/indietro, conflitti con spazi nel nome", () => {
  const r = parseStatusV2(REBASE_STATUS);
  assert.equal(r.detached, true);
  assert.equal(r.branch, null);
  assert.deepEqual(r.conflicts, ["plates.test.ts", "src/core/my plates.ts"]);
  const a = parseStatusV2(AHEAD_STATUS);
  assert.deepEqual([a.branch, a.upstream, a.ahead, a.behind, a.detached], ["feature/arrotonda", "origin/feature/arrotonda", 1, 2, false]);
});

test("lo stato di un rebase: passo, commit applicato, i due lati per nome", () => {
  const s = buildState(parseStatusV2(REBASE_STATUS), {
    rebase: { msgnum: 2, end: 3, headName: "refs/heads/feature/arrotonda", onto: "main", stoppedSubject: "Arrotonda il carico per difetto" },
  }, { "plates.test.ts": 1, "src/core/my plates.ts": 1 });
  assert.equal(s.op, "rebase");
  assert.deepEqual(s.step, { n: 2, total: 3 });
  assert.equal(s.rewriting, "feature/arrotonda");
  assert.deepEqual(sideNames(s), { ours: "main", theirs: "Arrotonda il carico per difetto", swapped: true });
  assert.ok(needsAttention(s));
  assert.deepEqual(nextSteps(s).map((x) => x.cmd ?? x.key), [
    "resolve",
    'git add plates.test.ts "src/core/my plates.ts"',
    "git rebase --continue",
    "git rebase --abort",
  ]);
  assert.deepEqual(pickCards(s), ["conflict-rebase", "abort", "push-rejected"]);
});

test("merge: i lati non sono invertiti e si chiude con un commit", () => {
  const s = buildState({ ...parseStatusV2(REBASE_STATUS), detached: false, branch: "feature/arrotonda" }, { merge: { from: "main" } });
  assert.deepEqual(sideNames(s), { ours: "feature/arrotonda", theirs: "main", swapped: false });
  assert.equal(nextSteps(s)[2]!.cmd, "git commit --no-edit");
  assert.equal(nextSteps(s)[3]!.cmd, "git merge --abort");
});

test("niente in corso: avanti e indietro insieme portano alla scheda del push rifiutato", () => {
  const s = buildState(parseStatusV2(AHEAD_STATUS), {});
  assert.equal(needsAttention(s), false);
  assert.deepEqual(nextSteps(s).map((x) => x.cmd), ["git pull --rebase", "git push"]);
  assert.deepEqual(pickCards(s), ["push-rejected"]);
});

test("i blocchi di conflitto, anche nello stile diff3", () => {
  const [b] = parseConflicts(PLATES);
  assert.ok(b);
  assert.deepEqual([b.start, b.separator, b.end], [1, 5, 10]);
  assert.equal(b.oursLabel, "HEAD");
  assert.equal(b.theirsLabel, "f592fca (Arrotonda il carico per difetto)");
  assert.equal(b.ours.length, 3);
  assert.equal(b.theirs.length, 4);
  const d3 = parseConflicts("<<<<<<< ours\na\n||||||| base\no\n=======\nb\n>>>>>>> theirs\n");
  assert.deepEqual([d3[0]!.ours, d3[0]!.base, d3[0]!.theirs], [["a"], ["o"], ["b"]]);
  assert.deepEqual(parseConflicts("<<<<<<< a\nnon chiuso\n"), []);
});

test("risolvere un blocco: un lato, entrambi, o l'unione approvata", () => {
  assert.equal(resolveBlock(PLATES, 0, "ours"), "export function platesFor(total, plates = PLATES) {\n  if (total < BAR) return ok([]);\n  return go(total, plates);\n}");
  assert.match(resolveBlock(PLATES, 0, "theirs")!, /roundDown/);
  assert.equal(resolveBlock("x\n<<<<<<< a\n1\n=======\n2\n>>>>>>> b\ny", 0, "both"), "x\n1\n2\ny");
  const union = "export function platesFor(total, plates = PLATES) {\n  const load = roundDown(total);\n  if (load < BAR) return ok([]);\n  return go(load, plates);\n";
  assert.equal(resolveBlock(PLATES, 0, { union }), union + "}");
  assert.equal(resolveBlock(PLATES, 1, "ours"), null);
});
