# 22 · SCAFFOLD: the plates test file, with a single example test

## Input
MODE: SCAFFOLD
LEVEL: junior
<bootstrap>
@include fixtures/mini-calc/bootstrap.md
</bootstrap>
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<task>
Scrivi i test dei dischi per lato
fare: casi: "20 kg: nessun disco", "22,5 kg: un 1,25 per lato", "60 kg: un 20 per lato", "142,5 kg: 25, 25, 10, 1,25 per lato", "15 kg: solo bilanciere con avviso"
fatto quando: file test/core/plates.test.ts
</task>
<files>
package.json
tsconfig.json
src/core/units.ts
src/core/result.ts
test/core/units.test.ts
</files>
<file path="src/core/units.ts">
@include fixtures/mini-calc/src/units.numbered.txt
</file>
<file path="src/core/result.ts">
@include fixtures/mini-calc/src/result.numbered.txt
</file>
STEP_SIGNATURES:
- platesFor(total: Grams): Result<PlateLoad>
FILE_TO_PREPARE: test/core/plates.test.ts
Rispondi solo con un oggetto JSON con i campi: imports (lista di { names, from }), constants (lista di { name, type, value, doc }), types (lista di { doc, declaration }), functions (lista di { doc, signature, pseudocode, question }), exampleTest ({ name, body } o null), testCases (lista di stringhe).

## Expected
Must:
- call platesFor (the expected signature), not an invented name
- import test from node:test, assert from node:assert/strict and platesFor from ../../src/core/plates.ts (ADR-005)
- a single complete, short exampleTest, on the simplest case (e.g. 20 kg: no plates)
- the other cases in testCases, with the task's names, edge cases first
- composeScaffold drops nothing
Must not:
- write more than one complete test
- declare functions
