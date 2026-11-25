# 42 · ASSIST similar: the same idea elsewhere (English)

## Input
MODE: ASSIST
LEVEL: mid
ASK: similar
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
LANGUAGE: en — write in English every text, schema fields included; only if the developer's own message is in another language, answer them in that language (project files stay in English).
Answer only with a JSON object with the fields: examples (list of { title, setup, trace }).

## Expected
Must:
- 2 greedy examples in another domain (coins, time units…), with starting values and a numeric trace, in English
Must not:
- the plates case
- code
