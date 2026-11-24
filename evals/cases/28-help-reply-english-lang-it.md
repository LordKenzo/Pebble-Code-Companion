# 28 · HELP: reply in English, project in Italian

The project is in Italian, but the developer replies to the balloon's question in English: the answer goes in English, with English headings.

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

## Expected
Must:
- answer in English, with the heading **Answer · right**
- confirm in one sentence and invite them to fix it themselves
Must not:
- give the fix (`>=`)
- answer in Italian
