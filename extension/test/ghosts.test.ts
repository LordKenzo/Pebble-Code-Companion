import { test } from "node:test";
import assert from "node:assert/strict";
import { GHOST_ADVICE, GHOSTS, withGhostModel } from "../src/core/ghosts";

const BASE = {
  provider: "anthropic" as const,
  anthropicModel: "claude-opus-5-5",
  anthropicEffort: "medium" as const,
  openaiModel: "gpt-x",
  localModel: "",
  lang: "it" as const,
};

test("senza scelte il fantasmino usa il modello di default", () => {
  assert.deepEqual(withGhostModel(BASE, { provider: "", model: "", effort: "" }), BASE);
});

test("il modello del fantasmino va nel campo del suo provider", () => {
  const a = withGhostModel(BASE, { provider: "", model: "claude-haiku-5-5", effort: "low" });
  assert.equal(a.anthropicModel, "claude-haiku-5-5");
  assert.equal(a.anthropicEffort, "low");
  const l = withGhostModel(BASE, { provider: "local", model: "qwen3-coder", effort: "" });
  assert.equal(l.provider, "local");
  assert.equal(l.localModel, "qwen3-coder");
  assert.equal(l.anthropicModel, "claude-opus-5-5");
});

test("valori sconosciuti non rompono niente", () => {
  const x = withGhostModel(BASE, { provider: "boh", model: " ", effort: "turbo" });
  assert.deepEqual(x, BASE);
});

test("ogni fantasmino ha il suo consiglio", () => {
  for (const g of GHOSTS) assert.ok(GHOST_ADVICE[g].typical.input > 0);
});
