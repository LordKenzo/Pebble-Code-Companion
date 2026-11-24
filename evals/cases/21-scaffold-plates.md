# 21 · SCAFFOLD: the skeleton of src/core/plates.ts

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
Implementa platesFor
fare: togli il bilanciere, dividi per due, scorri i dischi dal più pesante
firma: platesFor(total: Grams): Result<PlateLoad>
fatto quando: passano i test "20 kg", "22,5 kg", "60 kg", "142,5 kg"
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
FILE_TO_PREPARE: src/core/plates.ts
Rispondi solo con un oggetto JSON con i campi: imports (lista di { names, from }), constants (lista di { name, type, value, doc }), types (lista di { doc, declaration }), functions (lista di { doc, signature, pseudocode, question }), exampleTest ({ name, body } o null), testCases (lista di stringhe).

## Expected
Must:
- import `type Grams` from ./units.ts and `ok`/`invalid`/`type Result` from ./result.ts, with the .ts extension
- literal constants in grams: barbell 20_000 and plates from the heaviest (bootstrap › Vincoli, ADR-003)
- a type for the result (e.g. PlateLoad) without logic
- platesFor's signature and 3-6 pseudocode steps with the project's names, plus a question to work out by hand
- composeScaffold drops nothing
Must not:
- write platesFor's body or complete TypeScript expressions in the pseudocode
- propose tests (it isn't a test file)
