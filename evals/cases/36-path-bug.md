# 36 · PATH: a bug path starts from the test that reproduces it

The developer reports a bug in one sentence. The path must start with a test named after the bug that fails first, then the fix; it must stay inside the bug.

## Input
MODE: PLAN_STEP
LEVEL: junior
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
src/calculator/calculator.ts
src/calculator/calculator.test.ts
</files>
<file path="src/calculator/calculator.ts">
@include fixtures/calc/calculator.numbered.txt
</file>
<file path="src/calculator/calculator.test.ts">
@include fixtures/calc/calculator.test.numbered.txt
</file>
PATH_TO_PREPARE: bug · 0,1 + 0,2 mostra 0.30000000000000004 invece di 0,3
Answer only with a JSON object with the fields: reading, tasks (list of { title, todo, signature, doneWhen }), question.

## Expected
Must:
- first task: write a test named after the bug (e.g. "add: 0,1 + 0,2 = 0,3") that fails first, with a `test "…"` condition
- then the fix task, without giving the code; `reading` says where it comes from (floating point in `a + b`, or how the result is shown) without the fix
- 2 to 6 tasks, ending with "Rileggi con Pebble", `a mano`; conditions in Italian syntax
Must not:
- touch other operations or roadmap steps (no form, no step 4)
- contain code
