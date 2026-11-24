## ADR-002: The project's state lives in .pebble/, in versionable Markdown
Status: proposed
Context: reviews must be based on the project's decisions, and those decisions must be readable, editable and shareable with the team.
Decision: `.pebble/architecture.md`, `.pebble/roadmap.md` and `.pebble/decisions/ADR-*.md` are Markdown files in the repository. Pebble reads them on every request; the user can edit them by hand and Pebble respects them. Ephemeral state (cache, feedback) goes into a folder ignored by git.
Alternatives ruled out: a local database or state inside the extension (invisible, not versioned, not shareable).
Consequences: decisions go through the team's code reviews like code. Files edited by hand in unexpected ways must be handled (tolerant parsing).
