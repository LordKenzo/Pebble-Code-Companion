import { test } from "node:test";
import assert from "node:assert/strict";
import { composeBootstrap, type BootstrapAnswers } from "../src/core/bootstrap";

const answers: BootstrapAnswers = {
  name: "mini-calc",
  what: "Un programma da riga di comando che aiuta a caricare il bilanciere.",
  example: "- mini-calc 1rm 100 5 → massimale stimato\nmini-calc carichi 120 70 80 90 → carichi e dischi per lato\n",
  stack: "TypeScript su Node, nessun framework",
  rules: "Bilanciere da 20 kg\n• dischi: 25, 20, 15, 10, 5, 2,5, 1,25 kg in coppia\n\n",
  unknowns: ["Come strutturare le cartelle", "Da dove cominciare"],
  otherUnknown: "Arrotondare per difetto o al più vicino?\nDa dove cominciare",
};

test("compone il bootstrap nel formato che l'INIT si aspetta", () => {
  assert.equal(
    composeBootstrap(answers),
    [
      "# mini-calc — bootstrap",
      "",
      "## Cosa devo fare",
      "Un programma da riga di comando che aiuta a caricare il bilanciere.",
      "",
      "Esempio d'uso che immagino:",
      "- mini-calc 1rm 100 5 → massimale stimato",
      "- mini-calc carichi 120 70 80 90 → carichi e dischi per lato",
      "",
      "## Vincoli",
      "- TypeScript su Node, nessun framework",
      "- Bilanciere da 20 kg",
      "- dischi: 25, 20, 15, 10, 5, 2,5, 1,25 kg in coppia",
      "",
      "## Non so ancora",
      "- Come strutturare le cartelle",
      "- Da dove cominciare",
      "- Arrotondare per difetto o al più vicino?",
      "",
    ].join("\n"),
  );
});

test("risposte vuote: un bootstrap valido con i punti da scrivere segnati", () => {
  const md = composeBootstrap({ name: "", what: "", example: "", stack: "", rules: "", unknowns: [], otherUnknown: "" });
  assert.match(md, /^# Il mio progetto — bootstrap\n/);
  assert.match(md, /## Cosa devo fare\n_Da scrivere:/);
  assert.match(md, /## Vincoli\n- _Da scrivere:/);
  assert.match(md, /## Non so ancora\n- Da dove cominciare\n$/);
  assert.doesNotMatch(md, /Esempio d'uso/);
});

test("in inglese: sezioni del bootstrap", () => {
  const md = composeBootstrap({ name: "", what: "A CLI.", example: "", stack: "", rules: "", unknowns: [], otherUnknown: "" }, "en");
  assert.match(md, /^# My project — bootstrap\n\n## What I want to build\nA CLI\.\n\n## Constraints\n/);
  assert.match(md, /## What I don't know yet\n- Where to start\n$/);
});
