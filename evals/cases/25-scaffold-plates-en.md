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

## Atteso
Deve:
- doc, pseudocodice e domanda in inglese
- importare `type Grams` da ./units.ts e `ok`/`invalid`/`type Result` da ./result.ts, con estensione .ts
- costanti letterali in grammi: bilanciere 20_000 e dischi dal più pesante (bootstrap › Constraints, ADR-003)
- un tipo per il risultato (es. PlateLoad) senza logica
- la firma di platesFor e 3-6 passi di pseudocodice con i nomi del progetto, più una domanda da calcolare a mano
Non deve:
- scrivere il corpo di platesFor o espressioni TypeScript complete nello pseudocodice
- proporre test (non è un file di test)
