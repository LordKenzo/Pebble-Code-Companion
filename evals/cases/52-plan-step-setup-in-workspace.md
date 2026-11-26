# 52 · PLAN_STEP: step 1 of a brand-new project, from the first real trial (2026-11-26)

The trial's step 1 asked to `mkdir progetto-uno` and `cd` into it, so package.json would land in a subfolder and no task could tick; and two tasks shared the condition `file package.json`, so "add the test script" ticked before it was done. Prompt v1.9 says Pebble is already in the project's folder and adds the `script … "…"` condition.

## Input
MODE: PLAN_STEP
LEVEL: entry
<decisions>
@include fixtures/progetto-uno/decisions.md
</decisions>
<roadmap>
@include fixtures/progetto-uno/roadmap.md
</roadmap>
<files>
bootstrap.md
.pebble/architecture.md
.pebble/roadmap.md
</files>
STEP_TO_PREPARE: 1 · Preparare il progetto
Preparare il progetto: npm init -y, TypeScript e Vitest installati, un test finto che passa con npm test.
Answer only with a JSON object with the fields: reading, tasks (list of { title, todo, signature, doneWhen }), question.

## Expected
Must:
- run `npm init -y` in the current folder: no `mkdir`, no `cd`
- the install task closes with `dipendenza typescript vitest …`
- the "test" script task closes with `script test "vitest run"` (or `"vitest"`), not with `file package.json`
- the fake test task closes with `test "…"` (and/or `file tests/…`)
- no two tasks with the same condition; last task "Review with Pebble" with `a mano`
Must not:
- a task whose only condition is `file package.json` after the first one
