import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInitMessage, buildTextMessage, cleanTitle, decisionFile, initPlanToFiles, initPlanToMarkdown, type InitPlan } from "../src/core/modes";

const plan: InitPlan = {
  reading: "Una CLI per i carichi.",
  blockingQuestion: null,
  decisions: [
    { title: "Calcolo puro separato dalla CLI", context: "c", decision: "d", alternatives: "a", consequences: "q" },
    { title: "Arrotondamento per difetto", context: "c", decision: "d", alternatives: "a", consequences: "q" },
  ],
  layers: "cli → core",
  folders: "src/\n  core/\n  cli/",
  roadmap: ["Setup", "Dischi"],
  start: "Parti dai dischi.",
  question: "Dischi illimitati?",
};

test("il piano diventa architettura, roadmap e un file per ADR", () => {
  const files = initPlanToFiles(plan, "2026-11-23");
  assert.deepEqual(files.map((f) => f.path), [
    ".pebble/architecture.md",
    ".pebble/roadmap.md",
    ".pebble/decisions/ADR-001-calcolo-puro-separato-dalla-cli.md",
    ".pebble/decisions/ADR-002-arrotondamento-per-difetto.md",
  ]);
  assert.match(files[2].content, /^## ADR-001: Calcolo puro separato dalla CLI\nStato: proposto\n/);
  assert.match(files[1].content, /1\. Setup\n2\. Dischi/);
  assert.match(files[1].content, /Dischi illimitati\?/);
});

test("con una domanda bloccante il piano mostra solo la domanda", () => {
  const md = initPlanToMarkdown({ ...plan, blockingQuestion: "Web o mobile?" });
  assert.match(md, /Web o mobile\?/);
  assert.doesNotMatch(md, /Decisioni proposte/);
});

test("INIT porta livello e bootstrap", () => {
  const m = buildInitMessage("# B", "entry");
  assert.match(m, /^MODE: INIT\nLEVEL: entry\n<bootstrap>\n# B/);
  assert.match(m, /explain each technical term in brackets/);
});

test("NEXT non include il file aperto, CHAT include la conversazione recente", () => {
  const ctx = { bootstrap: "B", architecture: null, roadmap: "1. Setup", decisions: [] };
  const next = buildTextMessage("NEXT", ctx, "mid");
  assert.match(next, /<roadmap>\n1\. Setup/);
  assert.doesNotMatch(next, /<file/);
  const history = Array.from({ length: 12 }, (_, i) => ({ role: "user" as const, text: `msg${i}` }));
  const chat = buildTextMessage("CHAT", ctx, "mid", { question: "Perché?", history, file: { path: "a.ts", content: "x" } });
  assert.match(chat, /<file path="a.ts">\n1 \| x/);
  assert.doesNotMatch(chat, /msg3\b/);
  assert.match(chat, /msg11/);
  assert.match(chat, /Developer's question:\nPerché\?/);
});

test("toglie la numerazione messa dal modello nel titolo", () => {
  assert.equal(cleanTitle("ADR-003: CLI sottile"), "CLI sottile");
  assert.equal(cleanTitle("ADR 12 · Test"), "Test");
  assert.equal(cleanTitle("Arrotondamento per difetto"), "Arrotondamento per difetto");
  const files = initPlanToFiles({ ...plan, decisions: [{ ...plan.decisions[0], title: "ADR-001: Calcolo puro" }] }, "2026-11-23");
  assert.equal(files[2].path, ".pebble/decisions/ADR-001-calcolo-puro.md");
  assert.match(files[2].content, /^## ADR-001: Calcolo puro\n/);
});

const existing = [{ name: "ADR-001-calcolo-puro" }, { name: "ADR-005-test-runner-nativo-node-test" }];

test("una modifica a un ADR esistente riscrive il suo file, comunque sia scritto il numero", () => {
  for (const target of ["ADR-005", "adr 5", "ADR-05"]) {
    const f = decisionFile({ target, title: "Test runner", reason: "r", content: "## ADR-005: Test runner nativo\nStato: accettato" }, existing);
    assert.equal(f.path, ".pebble/decisions/ADR-005-test-runner-nativo-node-test.md");
    assert.equal(f.isNew, false);
    assert.equal(f.content, "## ADR-005: Test runner nativo\nStato: accettato\n");
  }
});

test("un ADR nuovo prende il numero successivo e il titolo se manca l'intestazione", () => {
  const f = decisionFile({ target: null, title: "ADR-009: Versione di Node", reason: "r", content: "Stato: proposto\nDecisione: Node 24 LTS" }, existing);
  assert.equal(f.id, "ADR-006");
  assert.equal(f.path, ".pebble/decisions/ADR-006-versione-di-node.md");
  assert.equal(f.content, "## ADR-006: Versione di Node\nStato: proposto\nDecisione: Node 24 LTS\n");
  assert.equal(f.isNew, true);
});

test("un riferimento a un ADR che non esiste diventa un ADR nuovo", () => {
  const f = decisionFile({ target: "ADR-042", title: "X", reason: "r", content: "Stato: proposto" }, existing);
  assert.equal(f.id, "ADR-006");
  assert.equal(f.isNew, true);
});
