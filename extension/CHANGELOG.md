# Changelog

Pebble is in **beta** (pre-release). Versions with an odd minor number (0.7.x) are pre-releases.

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
