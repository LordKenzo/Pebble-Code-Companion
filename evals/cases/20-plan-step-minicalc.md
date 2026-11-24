# 20 · PLAN_STEP: mini-calc's step 2, with the setup already done

Step 1's setup exists in the code. Pebble must break down step 2 without proposing the setup again, with conditions written in the path syntax.

## Input
MODE: PLAN_STEP
LEVEL: junior
<bootstrap>
@include fixtures/mini-calc/bootstrap.md
</bootstrap>
<architecture>
@include fixtures/mini-calc/architecture.md
</architecture>
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<path>
@include fixtures/mini-calc/percorso.step1-done.md
</path>
<files>
package.json
package-lock.json
tsconfig.json
test/smoke.test.ts
</files>
<file path="package.json">
@include fixtures/mini-calc/package.step1.numbered.txt
</file>
STEP_TO_PREPARE: 2 · Dischi per lato
Dischi per lato: per un carico già componibile restituisce i dischi. Test su 20, 22,5, 60, 142,5 kg e su un carico sotto i 20.
Rispondi solo con un oggetto JSON con i campi: reading (stringa), tasks (lista di { title, todo, signature (stringa o null), doneWhen (lista di stringhe) }), question (stringa o null).

## Expected
Must:
- not propose the setup again (it already exists)
- start with a "Write the tests …" task listing the cases: 20, 22.5, 60, 142.5 kg and below 20 kg
- have an implementation task with platesFor's signature in grams (ADR-003)
- use only conditions in the path syntax (checked with planToSection: none dropped)
- use in `test "…"` parts of the names listed in the tests task
- end with "Rileggi con Pebble" (review with Pebble), manual
Must not:
- contain code (function bodies or written tests)
