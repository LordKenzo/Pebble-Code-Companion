# Plan: Pebble as an on-request pair engineer

> Proposal of 2026-11-23, after the mini-calc trial and the `mockup/on-demand.html` mockup. Approved: the decisions are in `.pebble/decisions/` (ADR-003, ADR-006…009) and the steps in `.pebble/roadmap.md`, phase 2. Kept as a historical record: the roadmap shows where we are now.

## What we want

A pair engineer that trains you while you work, without writing the logic for you and without interrupting you:

1. **Path**: the roadmap step becomes a checklist of small tasks, each with what to do, the signature and when it counts as done.
2. **Automatic ticks**: a task closes when the tests and the compiler confirm it. No model needed: it's a free local check.
3. **Prepare the file**: imports, types, signature and the pseudocode as a comment inside the function, plus a question to think about.
4. **Balloon with ⌥P**: under the line, it starts with a question and climbs the help ladder. It offers "Why it matters" and "Deep dive".
5. **Notebook**: the concepts met along the way, marked as new, understood or to dig into.

The chat stays, but becomes secondary. No automatic interventions by the model.

## What is reused from v0.6

About two thirds of the extension's 2,440 lines remain useful.

| Part | Files | Use in the new version |
|---|---|---|
| Model providers | `adapters/llm/*`, `core/ports.ts` | Unchanged. `generate` with a zod schema serves the path, the skeleton and the balloon |
| Project context | `core/context.ts`, `adapters/store/workspaceStore.ts` | Unchanged, plus reading the path and the notebook |
| Zone filter | `core/policy.ts` | Unchanged. It stays the second defence for balloon and chat |
| Costs and budget | `core/cost.ts`, `adapters/vscode/spendLedger.ts` | Unchanged |
| Experience level | `LEVEL_HINTS` in `core/context.ts` | To align with v0.4: today it still says "no code" even for commands |
| INIT from bootstrap | `core/modes.ts` (InitPlan) | Unchanged. In addition, each roadmap step can generate its tasks |
| Prompt | `prompts/mentor.md` v0.4 | Three zones, help ladder and best practices stay. Three modes are added |
| Orchestration | `mentorSession.ts` (`run`, `account`, error handling) | To extract into a shared service, used by chat, balloon and skeleton |
| File review | `core/reviewFile.ts`, `diagnostics.ts` | Stays as a manual command and as the "Review with Pebble" task |
| Chat and settings | `chatView.ts`, `settingsPanel.ts` | Stay. The chat takes a back seat |
| Evals | `evals/run.py`, cases 01–14 | Unchanged, plus cases for the new modes |

To remove or switch off:
- the automatic guidance on every new file (`onDidCreateFiles`), which becomes an option, off by default;
- ADR-004 (automatic review on substantial changes), never implemented on save and to be superseded.

## What is new

### 1. Path model (`core/path.ts`, pure)
- `Task`: id, title, roadmap step, what to do, signature (optional), completion condition.
- `doneWhen` condition, one of:
  - `tests`: the tests with these names pass;
  - `file`: the file exists and exports these symbols;
  - `noErrors`: the file has no compiler errors;
  - `manual`: you tick it.
- `evaluate(tasks, signals)`: a pure function that says which tasks are done. If a test breaks, the task reopens.
- State on disk in `.pebble/percorso.md`, a Markdown checklist (`- [ ]`) readable and editable by hand, consistent with ADR-002 (ADR-007).

### 2. Local signals (`adapters/signals/`)
- **Compiler errors**: read from VS Code with `vscode.languages.getDiagnostics()`. The language server has already computed them, so there's no need to run `tsc`.
- **Tests**: a configurable command, default `node --test --test-reporter=tap`. Pebble reads the TAP output. Vitest, Jest (with a plugin) and pytest (with a plugin) also produce TAP, so it doesn't tie us to Node.
- **When**: on save, with a delay of about 1 second, or with the "Check the path" command. It's all local: it doesn't call the model and costs nothing.
- Results of tests run by other extensions can't be read: VS Code's API for that is still experimental. That's why we run them ourselves.

### 3. Path view (`adapters/vscode/pathView.ts`)
- A native `TreeView` with checkboxes (`TreeItem.checkboxState`, available since VS Code 1.80). Next to each task, its state: "1/4 tests". *(Built later as a webview, to stay faithful to the mockup.)*
- Selecting a task shows the details (what to do, signature, when it's done). There are two actions: "Prepare the file" and "Help me with this task".

### 4. Prepare the file (MODE: SCAFFOLD)
- The model answers with a schema: path, imports, declarations, and for each function the signature, the pseudocode steps and a question.
- **Pebble composes the file's text** from the schema's parts. By construction function bodies contain only comments, so zone C is guaranteed by the structure and not only by the filter.
- Before writing the file, Pebble shows a preview of the differences, as for the ADRs proposed in v0.5.

### 5. The balloon (MODE: HELP)
- **Command**: "Pebble, help me here", with the `⌥P` shortcut and an entry in the right-click menu.
- **Form**: a comment thread under the line, with VS Code's Comments API (`createCommentController`). It's the only stable way to have a box inside the editor. The buttons sit under the thread (`comments/commentThread/context` menu):
  - More concrete
  - Why it matters
  - Deep dive
  - Got it
- **Context sent to the model**:
  - the function you're in and the nearby lines;
  - the active task and the output of its failing tests;
  - the current rung and what has already been said in the thread.
- **Answer schema**:
  - the rung's text;
  - an optional question;
  - an optional concept for the notebook (title and summary).
- **Rung 1 is always a question**: in the mockup, "why does the loop skip the 20?".

### 6. Deep dive and notebook
- "Deep dive" calls MODE: HELP asking to explain the concept, suggest a habit and leave an exercise.
- The notebook lives in `.pebble/quaderno.md` and shows in a second `TreeView`. Each concept has a title, summary, status (new, understood, to dig into) and the task it came from.

## Decisions to update in `.pebble/`

- **ADR-003**: becomes "three zones". In addition, the skeleton is composed by Pebble from structured data.
- **ADR-004**: superseded by ADR-006. The only automatic thing is the local check that ticks tasks, without a model.
- **ADR-006 (new)**: Pebble steps in only on request.
- **ADR-007 (new)**: path and notebook as Markdown checklists in `.pebble/` (in the plan they were JSON, but that contradicted ADR-002).
- **ADR-008 (new)**: signals taken from VS Code's errors and from a test command with TAP output.
- **ADR-009 (new)**: the balloon uses the Comments API.

## Roadmap

Each step can be checked on its own and unlocks the next.

| # | Step | Done when |
|---|---|---|
| 0 | Commit v0.6, update the ADRs above | `.pebble/` describes the new direction |
| 1 | `core/path.ts`: model and `evaluate`, with tests | Cases covered: green test, test that goes red again, missing file, manual task |
| 2 | Path view from a hand-written `percorso.md` for mini-calc's step 2 | In VS Code you see the tasks and tick them by hand |
| 3 | Signals: VS Code errors and TAP tests on save | In mini-calc, writing `platesFor`, tasks tick themselves |
| 4 | MODE: PLAN_STEP: tasks generated from the roadmap step, with evals | Mini-calc's step 2 generates tasks similar to the hand-written ones |
| 5 | ⌥P balloon with the four rungs and "Why it matters", with evals | On the `>`/`>=` bug it starts with a question and never writes the body |
| 6 | Prepare the file: MODE: SCAFFOLD with a file composed by Pebble and a preview | `plates.ts` is born with signature and pseudocode, no body |
| 7 | Deep dive and notebook | The balloon's concepts show up in the notebook |
| 8 | Real trial on mini-calc, steps 1 to 3 | Notes on what is useful and what is noise, as for v0.5 |

After step 3 there's already something to try with no model costs: the path that ticks itself. The balloon arrives at step 5.

## Decided

- **The developer writes the tests** (2026-11-23). Pebble suggests which cases to cover and proposes **one first complete test** as an example to start from: it shows the style, then you write the others. Zone C of prompt v0.4, which bans any complete test, must be updated: the exception applies only to a task's first test. Automatic ticking links tests to the task by the names proposed in the task.

## Open questions

1. **Languages beyond TypeScript**: the signals are generic (VS Code errors and TAP), but the evals cover only TypeScript.
2. **Cost of the balloon**: one call per rung. With caching of the system prompt and a small model for rungs 1 and 2 it should stay under one cent, but it must be measured at step 5.
