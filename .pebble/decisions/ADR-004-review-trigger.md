## ADR-004: The automatic review starts only for substantial changes
Status: superseded by ADR-006 (2026-11-23)
Context: the bootstrap asks when a change deserves a review. Reviewing every save is costly and turns Pebble into noise.
Decision: on save, an automatic review only if since the last review: at least 15 lines changed, or imports or exports changed, or it's the first save with content of a new file. At most one automatic review per file every 2 minutes. A manual review is always possible. The thresholds are configurable.
Alternatives ruled out: a review on every save (cost and noise); manual only (it misses the right moment, which is the product's value).
Consequences: thresholds to tune with real use (roadmap step 8). Imports and exports are a good signal of architectural changes, but they must be recognised per language.

Why it's superseded: the review on save was never implemented. The mini-calc trial showed that the developer wants help that comes when called, not surprise interventions. See ADR-006.
