# Pebble's architecture

> Generated in MODE: INIT from the bootstrap on 2026-11-23, updated the same evening for the path (ADR-006…009). Status: proposed.

## Reading the bootstrap
A VS Code extension that acts as a pair engineer. It guides along a path of tasks, prepares signatures and pseudocode, and helps on request without ever writing the logic (ADR-003, ADR-006).
The value lies in two things: the quality of the advice and the fact that it is anchored to the project's decisions.
So the prompt is the product; the extension is the way to deliver it at the right moment.

## Layers

```
vscode adapter ─┐
llm adapter ────┼──▶ core (pure)
store adapter ──┘
```

- **core**: pure logic, no imports from `vscode` and no network calls. It builds the context, picks the mode, applies the zone filter, interprets the answers, reads and updates the path, and decides which tasks are done given the signals. It is tested without an editor and without APIs.
- **adapters**: everything that talks to the outside world. They implement interfaces defined in the core.
  - `vscode`: commands, file events, Diagnostics, panels
  - `llm`: model providers (ADR-005)
  - `store`: reading and writing `.pebble/`, including the path and the notebook (ADR-002, ADR-007)
  - `signals`: editor errors and TAP test output (ADR-008)

Rule: dependencies always point towards `core`. The core doesn't know VS Code exists.

## Folder structure

```
src/
  core/
    context/      gathers bootstrap, ADRs, files and diffs into a context for the model
    modes/        one definition per mode: INIT, PLAN_STEP, SCAFFOLD, HELP, REVIEW, TESTS, NEXT, CHAT
    policy/       filter on the three zones and limits on the answers (ADR-003)
    path/         the path: parsing percorso.md, evaluate(tasks, signals) (ADR-007, ADR-008)
    scaffold/     composes the file skeleton from structured data (ADR-003)
    notebook/     notebook of concepts (ADR-007)
    i18n/         Italian and English catalogs (ADR-012)
    model/        types: Note, Severity, Anchor, Decision, Task, Concept
  adapters/
    vscode/       extension, commands, Diagnostics, Path and Notebook views, balloon (ADR-009), conversation
    llm/          Claude, OpenAI and local providers (ADR-005)
    store/        files in .pebble/
    signals/      editor errors and the test command with TAP output (ADR-008)
prompts/          system prompt and versions
evals/            prompt evaluation cases
```
