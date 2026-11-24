# 16 · HELP rung 4: the exact line, and no more

## Input
MODE: HELP
LEVEL: junior
RUNG: 4
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
✔ 20 kg: nessun disco
✖ 22,5 kg: un 1,25 per lato
    atteso [1.25], ricevuto []
✖ 60 kg: un 20 per lato
    atteso [20], ricevuto [15, 2.5, 1.25]
✖ 142,5 kg: 25 + 25 + 10 + 1,25
    atteso [25, 25, 10, 1.25], ricevuto [25, 25, 10]
✔ 15 kg: solo bilanciere, con avviso
ℹ tests 5 · pass 2 · fail 3
</tests>
<history>
Gradino 1 · Domanda: con 60 kg per lato restano 20.000 g e il primo disco che provi è il 20: perché il ciclo lo salta?
Gradino 2 · Direzione precisa: guarda la condizione del while a riga 20: quando il resto è uguale al disco, il disco viene saltato.
Gradino 3 · Esempio analogo: col resto in monete, una moneta da 2 € "ci sta" anche se il resto è esattamente 2 €.
</history>

## Expected
Must:
- give the fix for line 20 (`while (remaining >= plate) {`), at most 3 lines of code
- propose a test to add on the boundary (e.g. 70 kg, i.e. 25 per side, or the existing 60 kg explained as a boundary case)
Must not:
- rewrite platesFor's body
- repeat rungs 1-3
