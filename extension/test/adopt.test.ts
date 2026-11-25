import { test } from "node:test";
import assert from "node:assert/strict";
import { adoptPlanToFiles, adoptPlanToMarkdown, baseCampSummary, buildAdoptMessage, type AdoptPlan, type AdoptSnapshot } from "../src/core/adopt";
import { parsePath } from "../src/core/path";
import { parseRoadmap, nextStep } from "../src/core/plan";

const SNAP: AdoptSnapshot = {
  files: [{ path: "package.json", content: '{ "devDependencies": { "jest": "^29" } }' }, { path: "src/todo.ts" }],
  readme: "# Todo",
  git: "27 commit · ultimo il 2026-11-21\n- fix: titolo vuoto",
  tests: { total: 8, passed: 7, red: ["salva: titolo vuoto"] },
};
const PLAN: AdoptPlan = {
  reading: "Una lista di cose da fare in React.",
  name: "todo",
  what: "Una lista di cose da fare.",
  stack: ["React", "TypeScript", "Jest"],
  constraints: ["Componenti funzionali"],
  unknowns: ["Il salvataggio non ha test"],
  decisions: [{ title: "ADR-001: Test con Jest", context: "Ci sono già 8 test.", decision: "I test usano Jest.", consequences: "Niente Vitest.", evidence: ["package.json › jest"] }],
  conflicts: [{ topic: "Errori", question: "Eccezioni o valori di ritorno?" }],
  layers: "UI → store",
  folders: "src/\n  todo.ts",
  paths: ["Fai passare il test rosso del titolo vuoto", "1. Aggiungi i test del salvataggio"],
  question: null,
};

test("il messaggio di adozione porta file, README, storia e test all'arrivo", () => {
  const m = buildAdoptMessage(SNAP, "junior", "it");
  assert.match(m, /^MODE: ADOPT\nLEVEL: junior/);
  assert.match(m, /<files>\npackage\.json\nsrc\/todo\.ts\n<\/files>/);
  assert.match(m, /<file path="package\.json">/);
  assert.match(m, /<git>\n27 commit/);
  assert.match(m, /<tests>\n7\/8 green\n✖ salva: titolo vuoto\n<\/tests>/);
  assert.match(m, /LANGUAGE: it/);
});

test("il campo base riassume file, test e storia", () => {
  assert.equal(baseCampSummary(SNAP), "2 file · 8 test, 7 verdi · 27 commit · ultimo il 2026-11-21");
  assert.equal(baseCampSummary({ files: [] }, "en"), "0 files · tests not run");
});

test("i file dell'adozione: ADR rilevati, roadmap con il passo 0 e percorso con il campo base chiuso", () => {
  const files = adoptPlanToFiles(PLAN, SNAP, "2026-11-25");
  const by = (p: string) => files.find((f) => f.path === p)?.content ?? "";
  assert.ok(files.some((f) => f.path === ".pebble/decisions/ADR-001-test-con-jest.md"));
  assert.match(files.find((f) => f.path.startsWith(".pebble/decisions/"))!.content, /Stato: rilevato dal codice \(da confermare\)\n[\s\S]*Dove si vede: package\.json › jest/);
  assert.match(by("bootstrap.md"), /^# todo — bootstrap/);
  assert.match(by("bootstrap.md"), /- Errori: Eccezioni o valori di ritorno\?/);
  const roadmap = parseRoadmap(by(".pebble/roadmap.md"));
  assert.deepEqual(roadmap.map((r) => r.n), [0, 1, 2]);
  assert.equal(roadmap[2]!.text, "Aggiungi i test del salvataggio");
  const path = by(".pebble/percorso.md");
  const tasks = parsePath(path).tasks;
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]!.checked, true);
  assert.equal(tasks[0]!.step, "Passo 0 · Campo base");
  assert.match(path, /> rosso all'arrivo: "salva: titolo vuoto"/);
  assert.equal(nextStep(roadmap, path)?.n, 1, "dopo il campo base si prepara il passo 1");
});

test("la proposta in chat mostra stato, evidenze, cosa decidere e i test rossi all'arrivo", () => {
  const md = adoptPlanToMarkdown(PLAN, SNAP, "en");
  assert.match(md, /\*\*ADR-001 · Test con Jest\*\* · \*Status: detected from the code \(to confirm\)\*/);
  assert.match(md, /`package\.json › jest`/);
  assert.match(md, /### To decide\n- \*\*Errori\*\*/);
  assert.match(md, /red on arrival: "salva: titolo vuoto"/);
});
