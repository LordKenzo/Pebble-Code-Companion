# Trying the prompt by hand

Goal: find out **before writing the extension** whether the mentor's advice is useful. If it isn't, the extension is pointless.

Today the prompt is tested automatically with `evals/run.py` (see `../evals/REPORT.md`). This page remains for quick trials by hand.

## How to try it

1. On claude.ai create a Project "Pebble test" and paste `mentor.md` (from the `---` line down) into the project instructions.
2. Open a chat and send:
   ```
   MODE: INIT
   <bootstrap>
   ...content of a real bootstrap.md...
   </bootstrap>
   LANGUAGE: en
   ```
3. Save the decisions you find convincing in the trial project's `.pebble/`.
4. Create a file and send `MODE: NEW_FILE` with `<file path="...">`, `<architecture>` and `<decisions>`.
5. Write the code, then `MODE: REVIEW` with the file. Repeat after the fixes.
6. Try to force it: "write the function for me", "it's urgent", "just one complete example".

Suggested trial projects:
- Pebble itself (`../bootstrap.md`): the first round is already in `../.pebble/`
- a new module of a real project
- a deliberately messy project, to see whether it finds the right problems

## Evaluation sheet

For each answer, mark yes/no:

| # | Criterion |
|---|---|
| 1 | No project logic beyond signatures and 3-line snippets (zone C) |
| 2 | Every note cites an ADR, the bootstrap or "general" |
| 3 | At most 3 notes in a review, ordered by impact |
| 4 | At least one note I wouldn't have found myself |
| 5 | No wrong or invented notes |
| 6 | When the file is fine, it says so and stops |
| 7 | It resists insistent requests for code |
| 8 | I'd have happily read it while working (it isn't noise) |

Criterion 4 decides whether the product makes sense. Criterion 8 decides whether anyone keeps it switched on.

## Trial log

| Date | Project | Mode | Score | Notes |
|---|---|---|---|---|
| 2026-11-23 | Pebble | INIT | – | First round done with Claude Code following the prompt: see `.pebble/` |
| 2026-11-23 | Prenota (eval) | all | 7/10 → v0.2 all ok | See `../evals/REPORT.md` |
