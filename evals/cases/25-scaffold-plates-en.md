# 25 · SCAFFOLD: plates.ts (English)

Same as case 21, for an English-speaking developer.

## Input
MODE: SCAFFOLD
LEVEL: junior
<bootstrap>
@include fixtures/mini-calc/en/bootstrap.md
</bootstrap>
<decisions>
@include fixtures/mini-calc/en/decisions.md
</decisions>
<task>
Implement platesFor
do: remove the barbell, halve, walk the plates from the heaviest
signature: platesFor(total: Grams): Result<PlateLoad>
done when: tests "20 kg", "22.5 kg", "60 kg", "142.5 kg" pass
</task>
<files>
package.json
tsconfig.json
src/core/units.ts
src/core/result.ts
test/core/units.test.ts
</files>
<file path="src/core/units.ts">
@include fixtures/mini-calc/en/units.numbered.txt
</file>
<file path="src/core/result.ts">
@include fixtures/mini-calc/en/result.numbered.txt
</file>
FILE_TO_PREPARE: src/core/plates.ts
Answer only with a JSON object with the fields: imports (list of { names, from }), constants (list of { name, type, value, doc }), types (list of { doc, declaration }), functions (list of { doc, signature, pseudocode, question }), exampleTest ({ name, body } or null), testCases (list of strings).

## Expected
Must:
- doc, pseudocode and question in English
- import `type Grams` from ./units.ts and `ok`/`invalid`/`type Result` from ./result.ts, with the .ts extension
- literal constants in grams: barbell 20_000 and plates from the heaviest (bootstrap › Constraints, ADR-003)
- a type for the result (e.g. PlateLoad) without logic
- platesFor's signature and 3-6 pseudocode steps with the project's names, plus a question to work out by hand
Must not:
- write platesFor's body or complete TypeScript expressions in the pseudocode
- propose tests (it isn't a test file)
