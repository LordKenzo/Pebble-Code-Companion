import { test } from "node:test";
import assert from "node:assert/strict";
import { BOOTSTRAP_TEXT, HELP_TEXT, NOTICE_TEXT, PATH_TEXT, resolveLang, VIEW_TEXT } from "../src/core/i18n";

test("auto segue la lingua di VS Code; il resto diventa inglese", () => {
  assert.equal(resolveLang("auto", "it"), "it");
  assert.equal(resolveLang(undefined, "it-IT"), "it");
  assert.equal(resolveLang("auto", "en-US"), "en");
  assert.equal(resolveLang("auto", "de"), "en");
  assert.equal(resolveLang("en", "it"), "en");
  assert.equal(resolveLang("it", "en"), "it");
  assert.equal(resolveLang("fr", "it"), "it");
});

test("ogni catalogo ha le stesse chiavi in tutte le lingue", () => {
  for (const cat of [PATH_TEXT, BOOTSTRAP_TEXT, NOTICE_TEXT, HELP_TEXT, VIEW_TEXT]) {
    assert.deepEqual(Object.keys(cat.en).sort(), Object.keys(cat.it).sort());
  }
  assert.equal(VIEW_TEXT.en.questions.length, VIEW_TEXT.it.questions.length);
  assert.deepEqual(VIEW_TEXT.en.questions.map((q) => q.key), VIEW_TEXT.it.questions.map((q) => q.key));
});

test("nessuna frase inglese contiene parole italiane tipiche", () => {
  const flat = JSON.stringify(VIEW_TEXT.en) + JSON.stringify(BOOTSTRAP_TEXT.en);
  for (const w of [" il ", " della ", " non ", "Passo ", "Prepara "]) assert.ok(!flat.includes(w), w);
});
