# mini-calc — bootstrap

## What I want to build
A command-line program that helps load a barbell.

- Estimates the one-rep max (1RM) from a set: weight lifted and reps done.
- Given a max, computes the loads for a list of percentages (e.g. 70%, 80%, 90%).
- Rounds each load to one that can really be built with the available plates
  and says which plates go on each side.

Example of use I have in mind:
- `mini-calc 1rm 100 5` → estimated max
- `mini-calc loads 120 70 80 90` → loads and plates per side

## Constraints
- TypeScript on Node, no framework
- 20 kg barbell; available plates: 25, 20, 15, 10, 5, 2.5, 1.25 kg (in pairs, one per side)
- The estimate formulas must be interchangeable (Epley, Brzycki…)
- I want tests, because getting a load wrong at the gym is dangerous

## What I don't know yet
- How to structure the folders for such a small project
- Whether to round down or to the nearest load
- What to do when a load can't be built or is below the barbell's weight
- Which test runner to use
- Where to start
