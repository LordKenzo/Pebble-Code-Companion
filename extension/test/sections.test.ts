import { test } from "node:test";
import assert from "node:assert/strict";
import { localSectionName, nextSectionNumber, parseSection, sectionHeading } from "../src/core/sections";
import { appendToDiary, parseDiary } from "../src/core/diary";
import { buildMapModel } from "../src/core/map";
import { parsePath } from "../src/core/path";

test("le sezioni si leggono in tutte e due le lingue, con il loro tipo", () => {
  assert.deepEqual(parseSection("## Bug 2 · Il totale è sbagliato"), { kind: "bug", n: 2, title: "Il totale è sbagliato" });
  assert.deepEqual(parseSection("Feature 1 · Export"), { kind: "feature", n: 1, title: "Export" });
  assert.deepEqual(parseSection("Funzionalità 3 · Storico"), { kind: "feature", n: 3, title: "Storico" });
  assert.equal(parseSection("Passo 0 · Campo base")!.kind, "step");
  assert.equal(parseSection("Note varie"), null);
  assert.equal(localSectionName("Feature 1 · Export", "it"), "Funzionalità 1 · Export");
  assert.equal(sectionHeading({ kind: "bug", n: 1, title: "X" }, "en"), "## Bug 1 · X");
});

test("il prossimo numero libero per tipo", () => {
  const md = "## Passo 1 · A\n- [x] a\n## Bug 1 · B\n- [ ] b\n## Bug 2 · C\n- [ ] c\n";
  assert.equal(nextSectionNumber(md, "bug"), 3);
  assert.equal(nextSectionNumber(md, "feature"), 1);
  assert.equal(nextSectionNumber(null, "bug"), 1);
});

test("nel diario Passo 1 e Bug 1 sono sezioni diverse", () => {
  const at = new Date(2026, 10, 25, 10, 0);
  let md = appendToDiary(null, { n: 1, title: "Setup" }, at, { kind: "stepClosed", done: 2, total: 2 });
  md = appendToDiary(md, { n: 1, title: "Totale", kind: "bug" }, at, { kind: "red", test: "totale: sconto" });
  md = appendToDiary(md, { n: 1, title: "Setup" }, at, { kind: "taskReopened", title: "a" });
  const sections = parseDiary(md);
  assert.deepEqual(sections.map((s) => [s.kind, s.n, s.entries.length]), [["bug", 1, 1], ["step", 1, 2]]);
  assert.match(md, /^## Bug 1 · Totale$/m);
});

test("sulla mappa i sentieri per funzionalità e bug sono rami a parte", () => {
  const md = [
    "## Passo 0 · Campo base", "- [x] Fotografia", "  fatto quando: a mano",
    "## Funzionalità 1 · Copia", "- [x] A", "  fatto quando: a mano",
    "## Bug 1 · Decimali", "- [x] Test che riproduce", "  fatto quando: a mano", "- [ ] Correggi", "  fatto quando: a mano",
  ].join("\n");
  const m = buildMapModel([{ n: 0, title: "Campo base", text: "Campo base" }], parsePath(md).tasks, []);
  assert.deepEqual(m.steps.map((s) => [s.kind, s.n, s.state]), [["step", 0, "done"]]);
  assert.deepEqual(m.paths.map((s) => [s.kind, s.n, s.title, s.state, `${s.done}/${s.total}`]), [
    ["feature", 1, "Copia", "done", "1/1"],
    ["bug", 1, "Decimali", "current", "1/2"],
  ]);
});
