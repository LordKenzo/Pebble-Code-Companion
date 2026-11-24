## ADR-006: Pebble steps in only on request
Status: accepted
Context: Pebble wants to be a pair engineer, not an automatic checker. After the mini-calc trial the developer asked for a guide that is "unobtrusive, that comes to help when you call it". The automatic review on save (ADR-004) and the guidance on every new file went the opposite way.
Decision: every call to the model starts from a gesture of the developer:
- a command;
- `⌥P` on the line;
- a button in the path ("Prepare the file", "Help me with this task", "Review the file");
- a chat message.
The only automatic thing is the local check of the path (ADR-008): it doesn't use the model, costs nothing and only changes the state of the checkboxes. The guidance on a new file becomes an option, off by default.
Alternatives ruled out: a review on save with thresholds (ADR-004: noise and cost, and it interrupts); suggestions while typing (the Clippy effect, and a model call for every pause).
Consequences: Pebble must be easy to find without making itself heard, with the path always visible in the panel and `⌥P` documented. There's no automatic "right moment" any more: the developer decides it. Step 7 of the old roadmap (triggers on save) is dropped.
