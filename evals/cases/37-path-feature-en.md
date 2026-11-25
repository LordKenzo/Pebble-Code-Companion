# 37 · PATH: a small feature path (English)

A feature in one sentence: the path stays as small as the sentence, starts from tests, follows the ADRs.

## Input
MODE: PLAN_STEP
LEVEL: mid
<decisions>
@include fixtures/calc/decisions.md
</decisions>
<roadmap>
@include fixtures/calc/roadmap.md
</roadmap>
<path>
@include fixtures/calc/percorso.step2-done.md
</path>
<files>
package.json
src/App.tsx
src/calculator/calculator.ts
src/calculator/calculator.test.ts
</files>
<file path="src/calculator/calculator.ts">
@include fixtures/calc/calculator.numbered.txt
</file>
PATH_TO_PREPARE: feature · a button that copies the result to the clipboard
LANGUAGE: en — write in English every text, schema fields included; only if the developer's own message is in another language, answer them in that language (project files stay in English).
Answer only with a JSON object with the fields: reading, tasks (list of { title, todo, signature, doneWhen }), question.

## Expected
Must:
- 2 to 6 tasks in English, starting from a test of the button (Testing Library, ADR-004), then the component change, then the review; English conditions (`test "…"`, `file … exports …`, `manual`)
- keep the copy in the UI, not in `src/calculator/` (ADR-002)
Must not:
- add unrelated work (other operations, form layout from step 4)
- contain code
