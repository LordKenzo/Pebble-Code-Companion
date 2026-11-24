# Pebble — bootstrap

## What I want to build
A Visual Studio Code extension that acts as a senior engineer while I write code.
It doesn't write code: it gives directions, guidelines, reviews and suggests tests.

Flow:
- read the project's `bootstrap.md` and propose architecture, structure and a first step
- save the decisions in `.pebble/` (architecture.md + ADRs)
- when a file is created: its role, responsibilities, what to avoid, at most one signature as a hint
- on save: a review against the ADRs and the bootstrap, shown as Diagnostics + a panel
- on request: `/review`, `/tests`, `/next`
- if asked for code: refuse and give a checklist

## Constraints
- VS Code extension in TypeScript
- LLM via API (Claude as first choice), key provided by the user
- Never code blocks beyond a few lines: a constraint in the prompt and a filter downstream
- Low costs: debounce, review only the diff, only on triggers
- The project's state lives in readable, versionable files (`.pebble/`), not in a database

## What I don't know yet
- VS Code's native chat participant or my own webview?
- How to decide when a change is "substantial" and deserves a review
- How to measure whether the advice is useful (👍/👎 feedback? ignored advice?)
- Business model: open source, freemium, team licence?
- Where to start
