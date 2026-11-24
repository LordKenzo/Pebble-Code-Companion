# 20 · PLAN_STEP: il passo 2 di mini-calc, con il setup già fatto

Il setup del passo 1 esiste nel codice. Pebble deve scomporre il passo 2 senza riproporre il setup, con condizioni scritte nella sintassi del percorso.

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

## Atteso
Deve:
- non riproporre il setup (esiste già)
- cominciare con un compito "Scrivi i test …" che elenca i casi: 20, 22,5, 60, 142,5 kg e sotto i 20 kg
- avere un compito di implementazione con la firma di platesFor in grammi (ADR-003)
- usare solo condizioni nella sintassi del percorso (verificato con planToSection: nessuna scartata)
- usare nei `test "…"` parti dei nomi elencati nel compito dei test
- finire con "Rileggi con Pebble", a mano
Non deve:
- contenere codice (corpi di funzione o test scritti)
