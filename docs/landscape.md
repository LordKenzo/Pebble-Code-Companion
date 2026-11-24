# Landscape: what already exists

Summary of the analyses done with Claude and Gemini (November 2026). The market changes fast: check again before important decisions.

## Tools close to the idea

| Tool | What it does | What it lacks compared to Pebble |
|---|---|---|
| Kiro (AWS), GitHub Spec Kit | Spec-driven development: requirements → design → tasks | Then the AI writes the code |
| Roo Code, Cline (custom modes) | "Architect"/"Reviewer" modes without write permissions, rules in `.clinerules` | Must be configured by hand; no flow tied to the file's life cycle |
| Cursor rules, Copilot instructions, `CLAUDE.md` | Project guidelines | Meant to guide the AI that writes, not the developer |
| Claude Code, "Learning" output style | Leaves `TODO(human)` for you to write | Terminal and single session, no project memory |
| CodeRabbit (also a VS Code extension), Sourcery, Copilot review | Review of local changes or PRs | Generic rules, not tied to the project's decisions |
| Qodo (formerly CodiumAI) | Behaviour analysis, edge cases, tests | Pushes towards generating the tests |

## What sets Pebble apart

1. **It doesn't write your logic, by design.** That's the product, not a setting.
2. **Project memory.** `bootstrap.md` → `.pebble/` (architecture + ADRs), used in every answer.
3. **A path checked by your tests.** Small steps that tick themselves when your tests and the compiler agree, not only feedback on the PR.

## Why it can matter

- **Cognitive debt from AI**: generating 500 lines is easy, maintaining them without having understood the design isn't.
- **Architectural drift**: by the tenth file the structure starts getting messy; someone needs to compare each file with the initial decisions.
- **Light TDD**: suggesting test cases while you write, not at the end of the day.

## Target users

- Developers who want to stay in charge of their own code
- Juniors and students (a mentor, not a shortcut)
- Teams that want architectural consistency

## Main risk

The Clippy effect. If the advice is too frequent or generic, it gets switched off within two days.
Countermeasures: help only on request (ADR-006), a discreet panel, adjustable experience level, advice always anchored to the project.
