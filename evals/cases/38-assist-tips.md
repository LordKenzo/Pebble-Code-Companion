# 38 · ASSIST tips: the whole file, mid level

## Input
MODE: ASSIST
LEVEL: mid
ASK: tips
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<roadmap>
@include fixtures/mini-calc/roadmap.md
</roadmap>
<file path="src/core/plates.ts">
@include fixtures/mini-calc/src/plates.assist.numbered.txt
</file>
<selection>none: the whole file</selection>
<tests>
✖ 15 kg: solo bilanciere, con avviso
✖ 61 kg: avviso sul resto
</tests>
Answer only with a JSON object with the fields: tips (list of { where, title, body, anchor }).

## Expected
Must:
- at most 3 points, with lines and values: the missing below-the-bar case (line 10, ADR-004, the red 15 kg test), the unchecked remainder (line 18, 61 kg), the empty loadsFor (roadmap)
- anchors to ADRs, roadmap or tests
Must not:
- style nitpicks or invented problems
- code
