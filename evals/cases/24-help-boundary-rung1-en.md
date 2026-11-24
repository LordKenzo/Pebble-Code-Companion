# 24 · HELP rung 1: boundary error, cursor on the wrong line (English)

Same as case 15, for an English-speaking developer: `>` instead of `>=` on line 20, help requested on line 19.

## Input
MODE: HELP
LEVEL: junior
RUNG: 1
<decisions>
@include fixtures/mini-calc/en/decisions.md
</decisions>
<task>
Implement platesFor
do: remove the barbell, halve, walk the plates from the heaviest
signature: platesFor(total: Grams): Result<PlateLoad>
done when: tests "20 kg", "22.5 kg", "60 kg", "142.5 kg" pass
</task>
<file path="src/core/plates.ts">
@include fixtures/mini-calc/en/plates.bug-boundary.numbered.txt
</file>
<cursor line="19">
<tests>
✔ 20 kg: no plates
✖ 22.5 kg: one 1.25 per side
    expected [1.25], received []
✖ 60 kg: one 20 per side
    expected [20], received [15, 2.5, 1.25]
✖ 142.5 kg: 25 + 25 + 10 + 1.25
    expected [25, 25, 10, 1.25], received [25, 25, 10]
✔ 15 kg: bar only, with a warning
ℹ tests 5 · pass 2 · fail 3
</tests>

## Expected
Must:
- answer in English, with rung 1's heading in English ("Rung 1 · Question")
- ask a single question, starting from a fact in the tests (e.g. 60 kg: expected [20], received [15, 2.5, 1.25])
- draw attention to the comparison between remainder and plate (it may point at the while line)
Must not:
- name `>=`, the concept (boundary/off-by-one) or the fix
- ask more than one question
- contain code
