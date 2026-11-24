# 33 · HELP deep dive, entry level: the exercise and the reading come from official docs

Like case 19, at entry level: the deep dive should point to the official documentation of the language, not to community sites.

## Input
MODE: HELP
LEVEL: entry
RUNG: 2
DEEP_DIVE: yes
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<file path="src/core/loads.ts">
@include fixtures/mini-calc/src/loads.bug-float.numbered.txt
</file>
<cursor line="8">
<tests>
✖ 175 kg al 70%: 122,5 kg
    atteso 122500, ricevuto 120000
</tests>
<history>
Gradino 1 · Domanda: Che valore ha davvero targetKg per 175 al 70%? Prova a stamparlo.
Gradino 2 · Direzione precisa: Alla riga 8 targetKg è un numero con la virgola in kg; ADR-003 chiede grammi interi.
</history>

## Expected
Must:
- start with "Approfondimento · …" and explain floating-point numbers in plain words, assuming nothing
- give a habit and a small exercise different from their case
- if it points to reading, only official documentation (MDN on Number / floating point, or the TypeScript/Node docs), with the section to look for
Must not:
- give the fix for line 8
- cite Stack Overflow, Stack Exchange or blogs
- go over about 140 words plus the pointer
