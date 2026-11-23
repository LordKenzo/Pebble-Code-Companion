import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateCost, formatUsd, resolvePrice } from "../src/core/cost";
import { buildReviewMessage } from "../src/core/context";

const usage = { inputTokens: 1_000_000, outputTokens: 100_000, cacheReadTokens: 2_000_000, cacheWriteTokens: 0 };

test("calcola il costo di Claude Opus 5.5 con la cache", () => {
  // 1M input × $4 + 0,1M output × $20 + 2M cache × $0,20 = 4 + 2 + 0,4
  assert.equal(estimateCost(usage, resolvePrice("claude-opus-5-5", false)), 6.4);
});

test("i modelli locali costano zero", () => {
  assert.equal(estimateCost(usage, resolvePrice("qwen3-coder:30b", true)), 0);
});

test("modello sconosciuto: costo non disponibile", () => {
  assert.equal(estimateCost(usage, resolvePrice("gpt-6.2-sol", false)), null);
});

test("i prezzi configurati hanno la precedenza, la cache senza prezzo usa quello dell'input", () => {
  const price = resolvePrice("gpt-6.2-sol", false, { "gpt-6.2-sol": { input: 1, output: 10 } });
  assert.equal(estimateCost(usage, price), 1 + 1 + 2);
});

test("formatta i costi piccoli con più decimali", () => {
  assert.equal(formatUsd(0.01234), "$0.0123");
  assert.equal(formatUsd(1.236), "$1.24");
  assert.equal(formatUsd(null), "prezzo non configurato");
});

test("il livello finisce nel messaggio, non nel prompt di sistema", () => {
  const msg = buildReviewMessage({ bootstrap: null, architecture: null, decisions: [] }, { path: "a", content: "", languageId: "ts" }, "entry");
  assert.match(msg, /^MODE: REVIEW\nLIVELLO: entry/);
});
