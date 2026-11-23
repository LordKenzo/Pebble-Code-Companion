import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReviewMessage, numberLines } from "../src/core/context";

test("numera le righe allineando i numeri", () => {
  const lines = numberLines(Array.from({ length: 10 }, (_, i) => `r${i + 1}`).join("\n")).split("\n");
  assert.equal(lines[0], " 1 | r1");
  assert.equal(lines[9], "10 | r10");
});

test("il contesto stabile precede il file", () => {
  const msg = buildReviewMessage(
    { bootstrap: "# B", architecture: "A", decisions: [{ name: "ADR-001", content: "D" }] },
    { path: "src/x.ts", content: "const a = 1", languageId: "typescript" },
  );
  assert.ok(msg.startsWith("MODE: REVIEW"));
  assert.ok(msg.indexOf("<bootstrap>") < msg.indexOf("<decisions>"));
  assert.ok(msg.indexOf("<decisions>") < msg.indexOf('<file path="src/x.ts"'));
  assert.match(msg, /### ADR-001\nD/);
  assert.doesNotMatch(msg, /mancano/);
});

test("segnala quando mancano bootstrap e decisioni", () => {
  const msg = buildReviewMessage(
    { bootstrap: null, architecture: null, decisions: [] },
    { path: "a.ts", content: "", languageId: "typescript" },
  );
  assert.match(msg, /mancano bootstrap\.md e \.pebble\/decisions/);
  assert.doesNotMatch(msg, /<bootstrap>/);
});
