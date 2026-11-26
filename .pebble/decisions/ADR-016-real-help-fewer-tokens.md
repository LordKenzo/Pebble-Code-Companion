## ADR-016: Real help at every level, with fewer tokens
Status: accepted (2026-11-26, supersedes zone C of ADR-003 and closes roadmap #18)
Context: the developer set two goals for the whole project. Pebble must be a **real help to write code at any level**, not a tool that holds code back. And it must **save tokens on paid APIs**. Zone C ("Pebble never writes the logic") was the founding rule, but in use it leaves people stuck, and #18 already asked for near-ready code at entry and junior. On costs, each call sent the whole system prompt (about 28 KB, some 7,000 tokens) whatever the mode, and spending was counted only by provider and model, so nobody could tell what the ⌥P panel costs compared with the roadmap.
Decision:
- **Pebble writes code at every level when asked.** The level changes the shape of the help, not whether it is given:
  - **entry and junior**: complete code, explained line by line, closing with a question to check understanding;
  - **mid**: leaner code, with the choices motivated and the delicate spots pointed out;
  - **senior**: targeted patches or diffs, alternatives and trade-offs, no basics.
- **Two things stay:**
  - code enters a file only when the developer approves it;
  - the diary records what came from Pebble, so the step review shows what the developer wrote and what they didn't.
- **Training becomes an option.** The help ladder that never hands over the solution (ADR-009, ADR-015) stays for those who want to practise. Choosing the level says what each one gets.
- **Every feature is judged on tokens too:**
  - **the system prompt is cut per mode**: the core plus only the requested mode's section, 45–56% shorter (`core/prompt.ts`; the evals cut it the same way);
  - **spending is counted by ghost and mode**, in the ledger and in the evals (tokens and cost per case);
  - next: a model per ghost with the recommended effort, work done without the model wherever the answer is deterministic (git state, tests, compiler errors), minimal context, answer caps per mode, and answers cached on disk by file content.
- **Ghosts and modes:**
  - **Roadmap**: INIT, ADOPT, PLAN_STEP, NEXT, SCAFFOLD;
  - **Mentor**: CHAT, REVIEW, TESTS, NEW_FILE, and HELP (the help ladder, moved here on 2026-11-26: in the evals a cheap model breaks its rules);
  - **⌥P helper**: ASSIST (the panel's tabs).
- **A model per ghost** (roadmap #20, 0.7.28): each ghost can use its own provider, model and effort, falling back to the default. The settings page shows the current model with the estimated cost of a typical call, and the recommendation from the evals: Roadmap a strong model at high effort, Mentor a mid, low-cost one at medium effort, the ⌥P helper a cheap or local one at low effort.
Alternatives ruled out:
- **Code only at entry and junior, and only as the last rung** (proposed earlier the same day): still holds back help from mid and senior, against the first goal.
- **Keeping one prompt and relying on provider caching**: the cache lasts minutes, and free or local models often have none.
Consequences:
- **What is already in place**: the cut prompt and the counts by ghost (0.7.25).
- **Still to do, with evals before and after:**
  - the prompt's "you do not write their logic" rules, the CHAT refusal and the `core/policy` filter, which in help mode no longer removes requested code;
  - the evals that expect a refusal (09, 13, 14);
  - the README and Marketplace wording, which still say "doesn't write your logic".
- **Prompt cross-references**: a mode section must no longer rely on another mode's text, since only one is sent. `test/prompt.test.ts` checks that every mode has its own section and that each cut prompt is under 70% of the whole.
