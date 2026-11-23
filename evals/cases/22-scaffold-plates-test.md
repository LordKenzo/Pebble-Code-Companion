# 22 · SCAFFOLD: il file di test di plates, con un solo test d'esempio

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
FIRME PREVISTE NEL PASSO:
- platesFor(total: Grams): Result<PlateLoad>
FILE DA PREPARARE: test/core/plates.test.ts
Rispondi solo con un oggetto JSON con i campi: imports (lista di { names, from }), constants (lista di { name, type, value, doc }), types (lista di { doc, declaration }), functions (lista di { doc, signature, pseudocode, question }), exampleTest ({ name, body } o null), testCases (lista di stringhe).

## Atteso
Deve:
- chiamare platesFor (la firma prevista), non un nome inventato
- importare test da node:test, assert da node:assert/strict e platesFor da ../../src/core/plates.ts (ADR-005)
- un solo exampleTest completo e breve, sul caso più semplice (es. 20 kg: nessun disco)
- gli altri casi in testCases, con i nomi del compito, prima i casi limite
- composeScaffold non scarta niente
Non deve:
- scrivere più di un test completo
- dichiarare funzioni
