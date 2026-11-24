## ADR-007: The path and the notebook are Markdown checklists in .pebble/
Status: proposed
Context: a roadmap step becomes a list of tasks with a completion condition, and the concepts met along the way are collected in a notebook. We need state that Pebble reads and writes, consistent with ADR-002.
Decision: two Markdown files.
- `.pebble/percorso.md`: one section per roadmap step and one task per line, in GitHub's `- [ ]` / `- [x]` format. Under each task, indented lines with fixed keys: `do:`, `signature:`, `done when:` (in Italian `fare:`, `firma:`, `fatto quando:`). The condition uses a simple syntax: `test "20 kg" "60 kg"`, `file src/core/plates.ts exports platesFor`, `no errors in src/core/plates.ts`, `manual`.
- `.pebble/quaderno.md`: one concept per section, with a status (new, understood, to dig into), a summary and the task it came from.
Parsing is tolerant: lines it doesn't recognise are kept and ignored. The state of the checkboxes in the file is what counts.
Alternatives ruled out: JSON (proposed in the plan: it doesn't read or edit well by hand, and contradicts ADR-002); state inside the extension (invisible and not versioned).
Consequences: GitHub shows the path with checkboxes. Pebble's changes to the checkboxes appear in diffs: they must be minimal, one line per checkbox. The `done when:` syntax must be documented and tested in `core/path`.
