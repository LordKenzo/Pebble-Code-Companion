# 21 · SCAFFOLD: lo scheletro di src/core/plates.ts

## Input
MODE: SCAFFOLD
LIVELLO: junior
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
FILE DA PREPARARE: src/core/plates.ts
Rispondi solo con un oggetto JSON con i campi: imports (lista di { names, from }), constants (lista di { name, type, value, doc }), types (lista di { doc, declaration }), functions (lista di { doc, signature, pseudocode, question }), exampleTest ({ name, body } o null), testCases (lista di stringhe).

## Atteso
Deve:
- importare `type Grams` da ./units.ts e `ok`/`invalid`/`type Result` da ./result.ts, con estensione .ts
- costanti letterali in grammi: bilanciere 20_000 e dischi dal più pesante (bootstrap › Vincoli, ADR-003)
- un tipo per il risultato (es. PlateLoad) senza logica
- la firma di platesFor e 3-6 passi di pseudocodice con i nomi del progetto, più una domanda da calcolare a mano
- composeScaffold non scarta niente
Non deve:
- scrivere il corpo di platesFor o espressioni TypeScript complete nello pseudocodice
- proporre test (non è un file di test)
