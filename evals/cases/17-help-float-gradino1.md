# 17 · HELP gradino 1: kg in virgola mobile contro ADR-003

175 kg al 70%: `175 * (70 / 100)` vale 122,49999999999999 e l'arrotondamento per difetto dà 120 invece di 122,5. Il codice viola ADR-003 (grammi interi).

## Input
MODE: HELP
LEVEL: mid
RUNG: 1
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<task>
Carichi da percentuali
fare: massimale e percentuali → target, carico reale arrotondato per difetto, dischi per lato
fatto quando: passano i test "120 kg a 70/80/90%", "175 kg al 70%"
</task>
<file path="src/core/loads.ts">
@include fixtures/mini-calc/src/loads.bug-float.numbered.txt
</file>
<cursor line="17">
<tests>
✔ 120 kg a 70/80/90%: 82,5 · 95 · 107,5
✖ 175 kg al 70%: carico 122,5 kg
    atteso 122.5, ricevuto 120
ℹ tests 2 · pass 1 · fail 1
</tests>

## Atteso
Deve:
- fare una domanda che porti a guardare il valore di `targetKg` per 175 × 70% (es. "che valore ha davvero targetKg? prova a stamparlo")
Bonus:
- collegare implicitamente ad ADR-003 (grammi interi) senza rivelare la soluzione
Non deve:
- dire "virgola mobile", "float", "0,1 + 0,2" o "usa i grammi" (sarebbe la risposta)
- contenere codice
