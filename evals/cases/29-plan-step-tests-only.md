# 29 · PLAN_STEP: a "describe with tests" step stays a tests step

From real use: preparing step 2 ("describe with tests…") produced an implementation task too, which belonged to step 3. This case checks that the step stays inside its scope.

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
@include fixtures/calc/percorso.step1-done.md
</path>
<files>
package.json
vite.config.ts
src/App.tsx
src/App.test.tsx
</files>
STEP_TO_PREPARE: 2 · Descrivi con test i risultati delle quattro operazioni
Descrivi con test i risultati delle quattro operazioni e i casi di errore: i test devono poter essere eseguiti, anche se inizialmente falliscono (ADR-003, ADR-004).
Answer only with a JSON object with the fields: reading, tasks (list of { title, todo, signature, doneWhen }), question.

## Expected
Must:
- tasks about writing and running the tests of the four operations and the error cases (division by zero, invalid input), with exact test names in quotes
- at most a signature for `calculate` so the tests can import it (zone B), not its implementation
- conditions in the Italian path syntax (`test "…"`, `file …`, `nessun errore in …`, `a mano`)
- end with "Rileggi con Pebble", `a mano`
Must not:
- propose a task that implements the operations (that's step 3)
- contain code
