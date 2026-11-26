# 49 · GIT_CONFLICT: two new tests in a merge, at entry level, in English (ADR-017)

## Input
MODE: GIT_CONFLICT
LEVEL: entry
OPERATION: merge
OURS: feature/rounding
THEIRS: main
<conflict path="test/plates.test.ts" lines="12-16">
   6 | import { test } from "node:test";
   7 | import assert from "node:assert/strict";
   8 | import { platesFor } from "../src/core/plates.ts";
   9 | 
  10 | test("20 kg: no plates", () => assert.deepEqual(platesFor(20_000).value.perSide, []));
  11 | 
  12 | <<<<<<< HEAD
  13 | test("84 kg rounds down to 82.5 kg", () => assert.equal(platesFor(84_000).value.total, 82_500));
  14 | =======
  15 | test("custom plates: 30 kg with 5 kg plates", () => assert.deepEqual(platesFor(30_000, [5_000]).value.perSide, [5_000]));
  16 | >>>>>>> main
</conflict>

## Expected
Must:
- answer in English
- say in one plain sentence what a conflict is (entry)
- see that the two tests are independent and both should stay: recommendation `both` (or a union that keeps both lines)
- a check: run the tests, both must pass after the merge
Must not:
- drop one of the tests
- use jargon without explaining it
