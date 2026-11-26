import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLanguages, languageOfPath, levelFor, levelsLine, readProfile, type LevelProfile } from "../src/core/level";

const P: LevelProfile = { project: "senior", byLanguage: { csharp: "entry" } };

test("il linguaggio viene dall'estensione del file", () => {
  assert.equal(languageOfPath("src/core/plates.ts"), "typescript");
  assert.equal(languageOfPath("Api/Controllers/Orders.CS"), "csharp");
  assert.equal(languageOfPath("README.md"), null);
  assert.equal(languageOfPath(undefined), null);
});

test("il livello di un file è quello del suo linguaggio, se c'è", () => {
  assert.equal(levelFor(P, "Api/Orders.cs"), "entry");
  assert.equal(levelFor(P, "web/app.tsx"), "senior");
  assert.equal(levelFor(P), "senior");
});

test("la riga LEVELS compare solo quando qualche linguaggio è diverso", () => {
  assert.equal(levelsLine(P), "LEVELS: csharp=entry, other=senior");
  assert.equal(levelsLine({ project: "mid", byLanguage: {} }), null);
  assert.equal(levelsLine({ project: "mid", byLanguage: { typescript: "mid" } }), null);
});

test("un profilo salvato male non rompe niente", () => {
  assert.deepEqual(readProfile(undefined, "mid"), { project: "mid", byLanguage: {} });
  assert.deepEqual(readProfile({ project: "boh", byLanguage: { csharp: "entry", cobol: "senior", go: "x" } }, "junior"), {
    project: "junior",
    byLanguage: { csharp: "entry" },
  });
});

test("i linguaggi del progetto, dal più presente", () => {
  assert.deepEqual(detectLanguages(["a.ts", "b.ts", "c.cs", "README.md", "d.tsx"]), ["typescript", "csharp"]);
});
