import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ghostOfMode, modeOf, promptForMode, splitPrompt, withLevels, withModePrompts, withTraining } from "../src/core/prompt";
import type { MentorModel } from "../src/core/ports";

const FULL = [
  "You are Pebble.",
  "## Rules",
  "Rule one.",
  "## Modes",
  "",
  "### MODE: REVIEW",
  "Review the file.",
  "",
  "### MODE: CHAT",
  "Answer the question.",
  "",
  "## Tone",
  "Direct.",
].join("\n");

test("modeOf legge la riga MODE del messaggio", () => {
  assert.equal(modeOf("MODE: ASSIST\nLEVEL: mid\nASK: tips"), "ASSIST");
  assert.equal(modeOf("LEVEL: mid\nMODE: PLAN_STEP"), "PLAN_STEP");
  assert.equal(modeOf("nessuna modalità"), null);
});

test("splitPrompt separa nucleo, modalità e coda", () => {
  const p = splitPrompt(FULL);
  assert.ok(p);
  assert.equal(p.core, "You are Pebble.\n## Rules\nRule one.");
  assert.deepEqual(Object.keys(p.modes), ["REVIEW", "CHAT"]);
  assert.equal(p.modes.CHAT, "### MODE: CHAT\nAnswer the question.");
  assert.equal(p.tail, "## Tone\nDirect.");
});

test("promptForMode tiene solo la sezione della modalità", () => {
  const out = promptForMode(FULL, "REVIEW");
  assert.match(out, /Rule one\./);
  assert.match(out, /### MODE: REVIEW\nReview the file\./);
  assert.match(out, /## Tone\nDirect\./);
  assert.doesNotMatch(out, /MODE: CHAT/);
});

test("senza modalità o con una sconosciuta torna il prompt intero", () => {
  assert.equal(promptForMode(FULL, null), FULL);
  assert.equal(promptForMode(FULL, "UNKNOWN"), FULL);
  assert.equal(promptForMode("no modes here", "REVIEW"), "no modes here");
});

test("il prompt vero: ogni modalità ha la sua sezione e il prompt si accorcia", () => {
  const full = readFileSync(join(__dirname, "..", "..", "..", "prompts", "mentor.md"), "utf8");
  const p = splitPrompt(full);
  assert.ok(p);
  for (const m of ["INIT", "ADOPT", "NEW_FILE", "REVIEW", "TESTS", "NEXT", "PLAN_STEP", "SCAFFOLD", "HELP", "ASSIST", "CHAT"]) {
    assert.ok(p.modes[m], `manca la modalità ${m}`);
    assert.ok(ghostOfMode(m), `nessun fantasmino per ${m}`);
    const out = promptForMode(full, m);
    assert.ok(out.length < full.length * 0.7, `${m}: ${out.length} su ${full.length}`);
    assert.match(out, /## Rules you never break/);
    assert.match(out, /## Tone/);
  }
});

test("withModePrompts manda il prompt della modalità e la segna sui token", async () => {
  const seen: string[] = [];
  const usage = { inputTokens: 10, outputTokens: 2, cacheReadTokens: 0, cacheWriteTokens: 0 };
  const inner: MentorModel = {
    provider: "fake",
    model: "m",
    generate: async (system) => { seen.push(system); return { data: {} as never, usage }; },
    chat: async (system) => { seen.push(system); return { text: "ok", usage }; },
    check: async () => {},
    listModels: async () => [],
  };
  const m = withModePrompts(inner);
  const a = await m.chat(FULL, "MODE: CHAT\nLEVEL: mid");
  assert.equal(a.usage.mode, "CHAT");
  assert.doesNotMatch(seen[0], /MODE: REVIEW/);
  const b = await m.chat(FULL, "una domanda senza modalità");
  assert.equal(b.usage.mode, undefined);
  assert.equal(seen[1], FULL);
});

test("in allenamento ogni messaggio porta TRAINING: yes, una volta sola", async () => {
  assert.equal(withTraining("MODE: CHAT", false), "MODE: CHAT");
  assert.equal(withTraining("MODE: CHAT", true), "MODE: CHAT\nTRAINING: yes");
  assert.equal(withTraining("MODE: CHAT\nTRAINING: yes", true), "MODE: CHAT\nTRAINING: yes");
  const sent: string[] = [];
  const usage = { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0 };
  const inner: MentorModel = {
    provider: "fake", model: "m",
    generate: async (_s, m) => { sent.push(m); return { data: {} as never, usage }; },
    chat: async (_s, m) => { sent.push(m); return { text: "", usage }; },
    check: async () => {}, listModels: async () => [],
  };
  await withModePrompts(inner, { training: true }).chat(FULL, "MODE: CHAT");
  await withModePrompts(inner).generate(FULL, "MODE: REVIEW", {} as never, "r");
  assert.deepEqual(sent, ["MODE: CHAT\nTRAINING: yes", "MODE: REVIEW"]);
});

test("la riga LEVELS si aggiunge solo se c'è e una volta sola", () => {
  assert.equal(withLevels("MODE: PLAN_STEP", null), "MODE: PLAN_STEP");
  assert.equal(withLevels("MODE: PLAN_STEP", "LEVELS: csharp=entry, other=senior"), "MODE: PLAN_STEP\nLEVELS: csharp=entry, other=senior");
  assert.equal(withLevels("MODE: X\nLEVELS: a=b", "LEVELS: c=d"), "MODE: X\nLEVELS: a=b");
});
