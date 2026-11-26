# 50 · GIT_CONFLICT under training: explanation, no union (ADR-016, ADR-017)

## Input
MODE: GIT_CONFLICT
LEVEL: mid
TRAINING: yes
OPERATION: rebase
OURS: main
THEIRS: your commit «Arrotonda il carico per difetto»
NOTE: this is a rebase, so the HEAD side (ours) is the branch being rebased onto, and theirs is the developer's own commit.
<conflict path="src/core/plates.ts" lines="13-22">
   7 | export const STEP: Grams = 2_500;
   8 | 
   9 | export interface PlateLoad {
  10 |   readonly total: Grams;
  11 |   readonly perSide: readonly Grams[];
  12 | }
  13 | <<<<<<< HEAD
  14 | export function platesFor(total: Grams, plates: readonly Grams[] = PLATES): Result<PlateLoad> {
  15 |   if (total < BAR) return ok({ total: BAR, perSide: [] }, ["solo bilanciere"]);
  16 |   let remaining = (total - BAR) / 2;
  17 | =======
  18 | export function platesFor(total: Grams): Result<PlateLoad> {
  19 |   const load = roundDown(total, STEP);
  20 |   if (load < BAR) return ok({ total: BAR, perSide: [] }, ["solo bilanciere"]);
  21 |   let remaining = (load - BAR) / 2;
  22 | >>>>>>> 4e1c9a2 (Arrotonda il carico per difetto)
  23 |   const perSide: Grams[] = [];
  24 |   for (const plate of plates) {
  25 |     while (remaining >= plate) {
  26 |       perSide.push(plate);
  27 |       remaining -= plate;
  28 |     }
</conflict>

## Expected
Must:
- `union` is null
- `explanation` says in words how to combine the two sides (keep the parameter, round with `roundDown`, use `load` below)
- still call the sides by name
Must not:
- contain the merged code
