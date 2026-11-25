# Changelog

Pebble is in **beta** (pre-release). Versions with an odd minor number (0.7.x) are pre-releases.

## 0.7.24
- **⌥P, the help panel** (ADR-015): a short menu, then a panel beside the code, and what you select decides the help. Nothing selected: suggestions on the file, what to study, pseudocode for what is missing (insertable as comments). Code selected: an explanation line by line, what to study, similar examples on a different case. The help ladder stays as one more entry when tests are red. The depth follows your level. The balloon under the line is retired.
- The settings gear sits with the other icons of the Path panel.

## 0.7.23
- **Feature and bug paths**: *New feature* and *New bug* (in the Path panel, its menu and the map) ask for one sentence and prepare a short path of 2–6 tasks from the code as it is now, shown as a diff. A bug path always starts with the test that reproduces it.
- **The map branches out**: paths for features and bugs leave the base camp as branches, each with its card and its diary; the ghost waits by the open one.

## 0.7.22
- **Adopt a project already under way**: when a folder has code but no `.pebble/`, Pebble offers to adopt it. It reads the files, the README, the git history and runs the tests once, then proposes the decisions it finds in the code (*detected, to confirm*), the questions where the code contradicts itself, and a **base camp**: a step 0 already closed, with the tests that were red on arrival. Possible next steps come from the code: a red test, a TODO, a missing test.

## 0.7.21
- **The mentor ghost**: Pebble now has a face. In the balloon and the chat it is neutral when it talks, thoughtful while it waits for the model, worried when the file doesn't compile, happy when you get the answer right; on the map it waits next to the active pebble.

## 0.7.19 · first public beta
- **Path map**: the whole roadmap as a trail of pebbles in an editor tab, with each step's diary next to it. The next step to prepare is highlighted, with its button.
- **Diary** (`.pebble/diario.md`): written by Pebble as you work, without a model: accepted plans, tests turning red and green, balloons and their concepts, closed tasks, reviews. Your own notes stay.
- **Review the step**: from the map or the closed-step card, the Mentor explains what you built and what is still fragile.
- **Test names on demand**: every step lists the test names its tasks expect, with their status, ready to copy.
- **Sources by level**: at entry level Pebble points only to the official documentation of your stack; at higher levels community sources too. It never invents links.
- New icon and visual identity.

## 0.7.10 – 0.7.18
- **English and Italian**, chosen with `pebble.language`; a single English prompt; Pebble answers in the language you write in.
- Planned steps stay inside their roadmap step and don't repeat what is already done.
- Compiler errors reach the balloon, the review and the chat: when a file doesn't compile, Pebble fixes that first.
- Vitest detected from `package.json`; `dependency` conditions; Restricted Mode support.

## 0.7.0 – 0.7.9
- **The Path panel**: tasks tick themselves when your tests and the compiler agree; tests never seen failing are flagged.
- **The `⌥P` balloon**: a help ladder that starts with a question, plus *why it matters* and *deep dive*.
- **Prepare step N** and **Prepare the file**: the next step from the code as it is now, and file skeletons with signatures and pseudocode, shown as diffs.
- Guided start: write `bootstrap.md` with a wizard, then a proposed plan with ADRs.
