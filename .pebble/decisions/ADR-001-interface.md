## ADR-001: Interface: Diagnostics and our own panel, VS Code chat as an extra
Status: proposed
Context: the bootstrap asks whether to use the native chat participant or our own webview. VS Code's chat is tied to the GitHub Copilot account (how binding that is today needs checking): relying only on it means depending on a competing product to show our own.
Decision: review notes go into Diagnostics (squiggles in the editor, Problems panel). The plan, new-file guidance and tests go into our own side panel. The `@pebble` chat participant comes later, as an extra channel for those already using the chat.
Alternatives ruled out: chat participant only (dependency on Copilot, no presence in the editor); Diagnostics only (not suited to plans and long answers).
Consequences: a bit more UI to build. In return Pebble works without Copilot and the notes sit where the work happens, in the editor.

Update 2026-11-23: "our own side panel" is a view in the activity bar (Pebble icon) shaped as a conversation, as in the mockup. Reviews appear there and in Diagnostics; spending stays in an editor panel.

Update 2026-11-23 (evening): with the path, the main interface becomes the "Path" view in the sidebar, a list with checkboxes. Next to it is the "Notebook", and the balloon on the line uses the Comments API (ADR-009). Diagnostics and the conversation remain, but the conversation takes a back seat.
