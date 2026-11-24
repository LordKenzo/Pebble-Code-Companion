# 30 · PLAN_STEP: the step is already done in the code

From real use: step 2 had already implemented the operations, and preparing step 3 ("write the operations") proposed implementing them again. Pebble must notice what is already there.

## Input
MODE: PLAN_STEP
LEVEL: entry
<decisions>
@include fixtures/calc/decisions.md
</decisions>
<roadmap>
@include fixtures/calc/roadmap.md
</roadmap>
<path>
@include fixtures/calc/percorso.step2-done.md
</path>
<files>
package.json
src/App.tsx
src/App.test.tsx
src/calculator/calculator.ts
src/calculator/calculator.test.ts
</files>
<file path="src/calculator/calculator.ts">
@include fixtures/calc/calculator.numbered.txt
</file>
<file path="src/calculator/calculator.test.ts">
@include fixtures/calc/calculator.test.numbered.txt
</file>
STEP_TO_PREPARE: 3 · Scrivi le operazioni in calculator
Scrivi le operazioni in calculator: i test dei calcoli devono passare (ADR-002, ADR-004).
Answer only with a JSON object with the fields: reading, tasks (list of { title, todo, signature, doneWhen }), question.

## Expected
Must:
- say in `reading`, in Italian, that `calculate` and its tests already exist (done in step 2)
- propose only what is really missing: e.g. a test for invalid input (`NaN`, line 4 has no test), maybe 0 ÷ 0, plus "Rileggi con Pebble"
- conditions in the Italian path syntax
Must not:
- propose implementing `calculate` or the four operations again
- propose rewriting the existing tests
- contain code
