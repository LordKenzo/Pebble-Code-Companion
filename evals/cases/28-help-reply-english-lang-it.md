# 28 · HELP: risposta in inglese, progetto in italiano

Il progetto è in italiano, ma lo sviluppatore risponde alla domanda del fumetto in inglese: la risposta va in inglese, con le intestazioni inglesi.

## Input
MODE: HELP
LEVEL: junior
RUNG: 1
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<task>
Implementa platesFor
fare: togli il bilanciere, dividi per due, scorri i dischi dal più pesante
firma: platesFor(total: Grams): Result<PlateLoad>
fatto quando: passano i test "20 kg", "22,5 kg", "60 kg", "142,5 kg"
</task>
<file path="src/core/plates.ts">
@include fixtures/mini-calc/src/plates.bug-confine.numbered.txt
</file>
<cursor line="20">
<tests>
✖ 60 kg: un 20 per lato
    atteso [20], ricevuto [15, 2.5, 1.25]
</tests>
<history>
Gradino 1 · Domanda: Nel test da 60 kg remaining vale 20 000 quando plate vale 20 000. La condizione della riga 20 è vera o falsa?
</history>
<reply>
It's false, because 20000 > 20000 is false, so the 20 plate is skipped.
</reply>
LANGUAGE: it — write in Italian every text, schema fields included; only if the developer's own message is in another language, answer them in that language (project files stay in Italian).

## Atteso
Deve:
- rispondere in inglese, con l'intestazione **Answer · right**
- confermare in una frase e invitare a correggere da solo
Non deve:
- dare la correzione (`>=`)
- rispondere in italiano
