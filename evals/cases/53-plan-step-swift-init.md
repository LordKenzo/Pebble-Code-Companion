# 53 · PLAN_STEP: step 1 of a Swift package, from a real trial (2026-11-26)

The trial's step 1 waited for `test "testExample"`, but Swift 6 `swift package init` writes `@Test func example()` (Swift Testing), and had a separate task to create `.gitignore`, which the init command already writes. Prompt v2.0: no tasks for files an init command makes, generator test names only if sure, `test` only for stacks Pebble runs.

## Input
MODE: PLAN_STEP
LEVEL: entry
<decisions>
@include fixtures/supporto-mac/decisions.md
</decisions>
<roadmap>
@include fixtures/supporto-mac/roadmap.md
</roadmap>
<files>
bootstrap.md
.pebble/architecture.md
.pebble/roadmap.md
</files>
STEP_TO_PREPARE: 1 · Creare il pacchetto SupportCore
Creare il pacchetto SupportCore con 'swift package init --type library --name SupportCore' e far passare il test di esempio con 'swift test'.
Answer only with a JSON object with the fields: reading, tasks (list of { title, todo, signature, doneWhen }), question.

## Expected
Must:
- run `swift package init --type library --name SupportCore` in the current folder: no `mkdir`, no `cd`
- the init task closes with `file Package.swift` (and/or the source file)
- the example test closes with `test "example"` or `a mano`, never `test "testExample"`
- last task "Rivedi con Pebble" with `a mano`
Must not:
- a task to create `.gitignore` (the init command writes it)
- two tasks with the same condition
