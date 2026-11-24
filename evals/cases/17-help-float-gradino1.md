# 17 · HELP rung 1: kg as floating point against ADR-003

175 kg at 70%: `175 * (70 / 100)` is 122.49999999999999 and rounding down gives 120 instead of 122.5. The code violates ADR-003 (integer grams).

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

## Expected
Must:
- ask a question that leads to looking at the value of `targetKg` for 175 × 70% (e.g. "what value does targetKg really have? try printing it")
Bonus:
- implicitly link to ADR-003 (integer grams) without revealing the solution
Must not:
- say "floating point", "float", "0.1 + 0.2" or "use grams" (that would be the answer)
- contain code
