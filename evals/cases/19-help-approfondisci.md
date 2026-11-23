# 19 · HELP approfondimento: errore di confine

## Input
MODE: HELP
LIVELLO: junior
APPROFONDISCI: sì
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

## Atteso
Deve:
- spiegare l'errore di confine (off-by-one) in generale, in 2-3 frasi
- proporre un'abitudine (es. un test esattamente sul valore limite per ogni confronto)
- proporre un esercizio diverso dal suo caso (es. un ciclo su un array, un controllo di età "maggiorenne")
Bonus:
- notare che il ciclo è un algoritmo greedy
Non deve:
- dare la correzione della riga 20
- superare circa 140 parole
