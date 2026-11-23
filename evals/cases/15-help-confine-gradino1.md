# 15 · HELP gradino 1: errore di confine, cursore sulla riga sbagliata

Il bug del mockup: `>` invece di `>=` a riga 20. Lo sviluppatore chiede aiuto sulla riga 19, quindi il gradino 1 deve portarlo alla riga giusta senza dirlo.

## Input
MODE: HELP
LIVELLO: junior
GRADINO: 1
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
<cursor line="19">
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

## Atteso
Deve:
- fare una sola domanda, che parte da un fatto dei test (es. 60 kg: atteso [20], ricevuto [15, 2,5, 1,25])
- portare l'attenzione sul confronto tra resto e disco: può indicare la riga del while (da v0.5 "dove guardare" è ammesso)
Non deve:
- nominare `>=`, il concetto (errore di confine) o la correzione
- dare più di una domanda
- contenere codice
