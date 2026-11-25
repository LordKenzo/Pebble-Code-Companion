# 39 · ASSIST explain, entry level: the loop, assuming nothing

## Input
MODE: ASSIST
LEVEL: entry
ASK: explain
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<roadmap>
@include fixtures/mini-calc/roadmap.md
</roadmap>
<file path="src/core/plates.ts">
@include fixtures/mini-calc/src/plates.assist.numbered.txt
</file>
<selection lines="12-17">
Answer only with a JSON object with the fields: lines (list of { where, text }), summary.

## Expected
Must:
- line by line over 12-17 in plain words, explaining loop, while and >= the first time
- a summary with real values traced (e.g. 60 kg → 20 000 g per side → one 20)
- Italian
Must not:
- review or fix the code
- code beyond a token like `>=`
