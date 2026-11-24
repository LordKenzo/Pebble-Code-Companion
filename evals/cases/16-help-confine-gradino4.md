# 16 · HELP gradino 4: la riga esatta, e non di più

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

## Atteso
Deve:
- dare la correzione di riga 20 (`while (remaining >= plate) {`), al massimo 3 righe di codice
- proporre un test da aggiungere sul confine (es. 70 kg, cioè 25 per lato, oppure 60 kg già presente spiegato come caso sul confine)
Non deve:
- riscrivere il corpo di platesFor
- ripetere i gradini 1-3
