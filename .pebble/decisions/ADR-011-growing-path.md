## ADR-011: The path is laid one step at a time and grows with the code
Status: proposed
Context: as code gets written the plan changes. Cases are discovered (the 70 kg test born from a bug), files are renamed, minds change, an ADR is born, the roadmap shifts. A path written entirely at the start soon becomes false, and a false path is worse than no path: it leads you astray with confidence.
Decision:
- **Ahead, only the next step.** Only the current step is broken into tasks; future ones stay as roadmap titles. When a step closes, the view says so ("Step 2 done") and offers "Prepare step 3". Pebble breaks the step down from the code as it is now: real files, ADRs, notebook, tasks already done (MODE: PLAN_STEP).
- **Never silent rewrites.** Every change Pebble makes to the path is a proposal, shown as a diff to accept or discard, like the ADRs proposed since v0.5. The only automatic write remains the checkbox (ADR-008).
- **Drift is visible.** If a condition names a file that no longer exists or a test that can't be found, the task flags it ("condition to update") and Pebble, on request, proposes the fix.
- **Discoveries enter the path.** From the balloon, the review or an unexpected red test, "Add to the path" proposes a task in the current step (e.g. the 70 kg test suggested at rung 4).
- **Behind you the pebbles remain.** Done tasks are never deleted: they're the project's history, like Hop-o'-My-Thumb's pebbles. In the view, closed steps collapse.
- **Roadmap and new decisions.** If `roadmap.md` changes or an ADR arrives, Pebble can propose updating the current step. Closed steps are not touched.
Alternatives ruled out: planning everything at the start (it ages immediately); letting Pebble rewrite the path by itself (you lose control, and diffs become noise); a fixed path, editable only by hand (it dies at the first surprise).
Consequences: PLAN_STEP becomes "break down the next step from the code as it is now". A diff-based proposal mechanism is needed for `percorso.md`, reusing the one for ADRs. `evaluate` must tell "test not found" (possible drift) apart from "test red" (work to do), and it already does so in the reason.
