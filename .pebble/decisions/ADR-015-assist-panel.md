## ADR-015: ⌥P opens a help panel, and what you select decides the help
Status: accepted (2026-11-25, supersedes the balloon interface of ADR-009)
Context: in use, the balloon under the line felt narrow: it only climbs a help ladder from a red test, while the developer also wants to understand code, know what to study and get pseudocode for what is missing. They asked that ⌥P change with the selection, and that the depth follow the declared level.
Decision:
- **⌥P shows a short menu**, like the command palette. Enter picks the first entry.
  - **No selection** (the whole file): *Suggestions on the file*, *What to study*, *Pseudocode for what is missing*, and *Help me with the red test* only when tests are red.
  - **Code selected**: *Explain this code*, *What to study here*, *Similar examples*, *Help me find the mistake*.
- **The help opens in a panel beside the code**, with the entries as tabs. Each tab is asked to the model only when opened, then kept for that file and selection.
- **The help ladder of ADR-009 survives as a tab** (red test / find the mistake), with its rungs, *why it matters* and *deep dive*. Its diary events stay (ADR-013).
- **The level changes how much is taken for granted, not what can be asked**: entry explains every term and traces real values step by step; senior is terse, with costs and alternatives (and the sources of #14).
- **Zone C stays** (ADR-003): explanations of the developer's own code, pseudocode and examples on a different case are fine; the body of their function is not. *Pseudocode* can be inserted as comments in the empty function.
Alternatives ruled out: keeping the balloon and adding modes to it (a comment thread is too narrow for tabs, tables and traces); a chat question for each case (the developer has to know what to ask, which is what ⌥P is meant to avoid).
Consequences: a new MODE: ASSIST with one structured answer per tab, and its evals per level. The Comments API balloon is retired; the ghost moves into the panel. One more editor tab can feel heavy: the panel opens beside, keeps focus on the code and reuses the same tab.
