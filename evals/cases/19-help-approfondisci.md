# 19 · HELP deep dive: boundary error

## Input
MODE: HELP
LEVEL: junior
DEEP_DIVE: yes
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
</history>

## Expected
Must:
- explain the boundary error (off-by-one) in general, in 2-3 sentences
- propose a habit (e.g. a test exactly on the limit value for every comparison)
- propose an exercise different from their case (e.g. a loop over an array, an "adult" age check)
Bonus:
- notice that the loop is a greedy algorithm
Must not:
- give the fix for line 20
- go over about 140 words
