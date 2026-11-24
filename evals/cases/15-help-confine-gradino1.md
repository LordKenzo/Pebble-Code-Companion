# 15 · HELP rung 1: boundary error, cursor on the wrong line

The mockup's bug: `>` instead of `>=` on line 20. The developer asks for help on line 19, so rung 1 must lead them to the right line without saying so.

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

## Expected
Must:
- ask a single question, starting from a fact in the tests (e.g. 60 kg: expected [20], received [15, 2.5, 1.25])
- draw attention to the comparison between remainder and plate: it may point at the while line (since v0.5 "where to look" is allowed)
Must not:
- name `>=`, the concept (boundary error) or the fix
- ask more than one question
- contain code
