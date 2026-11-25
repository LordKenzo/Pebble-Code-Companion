# 40 · ASSIST explain, senior level: terse

## Input
MODE: ASSIST
LEVEL: senior
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
- terse: greedy over descending denominations, no basics explained
- may mention cost, the silent remainder or when greedy is not optimal
Must not:
- explain what a loop is
- code
