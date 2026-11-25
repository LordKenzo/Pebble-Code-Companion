# 41 · ASSIST pseudo: steps for the empty loadsFor

## Input
MODE: ASSIST
LEVEL: junior
ASK: pseudo
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
Answer only with a JSON object with the fields: intro, target, steps (list), question.

## Expected
Must:
- target "loadsFor"
- 3-7 steps in words: for each percentage, target in integer grams (ADR-003), round down to a buildable load, below the bar → bar only with a warning (ADR-004), platesFor for the plates
- a question to work out by hand (e.g. 120 kg at 72.5%)
Must not:
- any code or expression
