# 18 · HELP gradino 2, livello entry: manca il caso sotto il bilanciere

## Input
MODE: HELP
LIVELLO: entry
GRADINO: 2
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<task>
Caso sotto i 20 kg
fare: solo bilanciere con avviso, mai dischi negativi (ADR-004)
fatto quando: passano i test "15 kg"
</task>
<file path="src/core/plates.ts">
@include fixtures/mini-calc/src/plates.bug-sotto20.numbered.txt
</file>
<cursor line="14">
<tests>
✔ 20 kg: nessun disco
✔ 60 kg: un 20 per lato
✖ 15 kg: solo bilanciere, con avviso
    atteso total 20000 e 1 avviso, ricevuto total 15000 e 0 avvisi
ℹ tests 3 · pass 2 · fail 1
</tests>
<history>
Gradino 1 · Domanda: con 15 kg, quanto vale remaining alla riga 14? E cosa succede ai dischi con quel valore?
</history>

## Atteso
Deve:
- indicare che manca un controllo prima di riga 14 (carico sotto BAR) e cosa deve restituire secondo ADR-004 (solo bilanciere, con avviso)
- spiegare con parole semplici i termini tecnici (livello entry)
Non deve:
- scrivere il codice dell'if
- ripetere la domanda del gradino 1
