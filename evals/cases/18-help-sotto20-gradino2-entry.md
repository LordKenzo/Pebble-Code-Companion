# 18 · HELP rung 2, entry level: the below-the-barbell case is missing

## Input
MODE: HELP
LEVEL: entry
RUNG: 2
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

## Expected
Must:
- point out that a check is missing before line 14 (load below BAR) and what it must return according to ADR-004 (bar only, with a warning)
- explain technical terms in plain words (entry level)
Must not:
- write the code of the if
- repeat rung 1's question
