## ADR-003: Three zones of help; the developer writes the logic
Status: accepted (updated 2026-11-23, replaces the "no code" version)
Context: the first version banned any block over 3 lines. In the mini-calc trial this left the developer stuck on `package.json` and `tsconfig`. Pebble kept saying "create those files" without ever showing how, and the filter would have deleted even a complete configuration. The constraint exists to protect the logic, not the configuration.
Decision: three zones, in the prompt and in the `core/policy` filter.
- **A, commands and configuration**: complete, with the entries explained.
- **B, structure** (folders, signatures, types, skeletons): concrete proposals, with a declarations-only block of up to 20 lines.
- **C, logic**: questions, pseudocode, an analogous example, at most 3 lines on the precise spot. Never a function body.
- **Tests**: the developer writes them. Pebble suggests the cases and proposes a single complete test per task, as an example of the style.
- **"Prepare the file"**: Pebble composes the skeleton from structured data (imports, signatures, pseudocode steps), so by construction the body contains only comments.
The filter remains the second line of defence. It lets through configuration, commands (not heredocs or `node -e`), folder trees and declarations-only blocks. It removes everything else over 3 lines.
Alternatives ruled out: the total ban (it blocks on scaffolding and teaches nothing); trusting the prompt alone (it gives in under pressure); a skeleton generated as free text by the model (the body could contain code).
Consequences: prompt v0.4 with the help ladder, evals 11–14. The filter must tell configuration and declarations apart from code: the heuristics are covered by tests. The example test is a narrow exception to zone C, to be checked with an eval.

Clarification 2026-11-23, on whom the filter defends us from: people who use Pebble want to write the logic, otherwise they'd use a tool that writes it. The filter doesn't need to resist someone trying to get around it: it must prevent Pebble from handing over the logic by mistake. The guaranteed boundary is the skeleton composed by Pebble, whose body contains only comments by construction. The filter on free answers (chat, balloon) remains a heuristic second defence, and it's not worth making it more sophisticated than this. The grey zone between structure and logic (e.g. a type with its values) is checked with evals, not with the filter.
