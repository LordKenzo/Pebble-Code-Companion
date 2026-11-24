## ADR-001: Pure calculation separated from the CLI
Status: proposed
Context: the calculation is the dangerous part and must be tested without going through the terminal.
Decision: a `core` module with pure functions only (no `process`, no `console`) and a `cli` module that reads the arguments, calls the core and prints the result. The dependency goes only from cli to core.
Alternatives ruled out: a single file, where parsing and calculation mix and tests must fake `argv`; more layers (services, repositories), too many for a project with no I/O.
Consequences: the core is testable in isolation. It takes some discipline not to leak logic into the CLI.

## ADR-002: Formulas as functions with a common signature and a registry by name
Status: proposed
Context: Epley, Brzycki and other formulas must be interchangeable.
Decision: each formula is a function with the same type (weight and reps in, 1RM out). A registry maps them to a name chosen with a CLI option, with a default.
Alternatives ruled out: classes with the strategy pattern, useless without state; a `switch` in the CLI, which moves the choice out of the core.
Consequences: adding a formula takes one function and one registry entry. Tests can be written once and run on every formula.

## ADR-003: Round down, integer gram arithmetic
Status: proposed
Context: percentages produce decimals and the load must be buildable. Choosing between rounding down and nearest is a safety choice.
Decision: always round down to the nearest buildable multiple, which today is 2.5 kg total (1.25 per side). Internally everything is in integer grams, converted to kg only in the output.
Alternatives ruled out: rounding to nearest, which can exceed the planned percentage (at the gym a kilo less is better); floats in kg, because errors like 0.1 + 0.2 lead to "almost" buildable loads.
Consequences: loads never exceed the target. The output must show both the target and the real load, so the difference is visible.

## ADR-004: Anomalies as explicit results, not silent exceptions
Status: proposed
Context: loads below 20 kg, invalid input, too many reps for the estimate to be reliable. Splitting into plates also needs an assumption about the inventory.
Decision: the core returns a result with an outcome: ok, ok with a warning, or invalid. Below 20 kg the outcome is "bar only" with a warning, never negative plates. Invalid input (weight ≤ 0, reps not integer or ≤ 0, percentages outside 1–100) gives an error. Over 10 reps there is an unreliable-estimate warning. The CLI turns outcomes into messages and a non-zero exit code for errors. Plates are unlimited per size; expected working loads are below 999 kg.
Alternatives ruled out: throwing from the core, which makes the flow less readable and tests less explicit; ignoring anomalies, which produces misleading output; a finite inventory, which doesn't match the current requirement.
Consequences: every anomaly is testable as a value and plate splitting doesn't need to track availability. Return types get a bit richer.

## ADR-005: Native `node:test` runner
Status: proposed
Context: we need tests and the constraint is no framework.
Decision: `node:test` with `node:assert`. `.ts` files run directly thanks to Node's type stripping (22.18+ or 24 LTS).
Alternatives ruled out: Jest, which needs heavy configuration with TypeScript; Vitest, great but a dependency we don't need here.
Consequences: zero runtime dependencies for tests. Type stripping forbids `enum` and parameter properties: use string unions. `tsc --noEmit` remains the type check.
