# Roadmap

## Phase 1: mentor in chat (v0.1–v0.6)

| # | Step | Status |
|---|---|---|
| 1 | Prompt evaluation cases in `evals/` | ✅ 14 cases, prompt v0.4 |
| 2 | Structured format for REVIEW, mapped to Diagnostics | ✅ |
| 3 | `core/policy`: zone filter with its tests | ✅ (updated to three zones, ADR-003) |
| 4 | Command-line eval runner | ✅ `evals/run.py` with Claude Code |
| 5 | Minimal extension: file review → Diagnostics and panel | ✅ |
| 6 | `init` from `bootstrap.md` that writes `.pebble/` | ✅ |
| 7 | Automatic triggers on new file and save | ⛔ dropped (ADR-006) |
| 7b | Experience level and spending log | ✅ |
| 8 | Trial on a real project | ✅ mini-calc: too generic and too passive, hence phase 2 |

## Phase 2: the path (plan in `docs/pair-engineer-plan.md`)

| # | Step | Done when |
|---|---|---|
| 0 ✅ | Commit v0.6 and the ADRs of the new direction (003, 004 superseded, 006–009) | `.pebble/` describes the path |
| 1 ✅ | `core/path`: parsing `percorso.md` and `evaluate`, with tests | Covered: green test, test that goes red again, missing file, manual task, unknown lines preserved |
| 2 ✅ | Path view from a hand-written `percorso.md` for mini-calc's step 2 | In VS Code you see the tasks and tick them by hand, and the file updates |
| 2b ✅ | **Balloon prompt (MODE: HELP) and its evals, without UI.** 3-4 real mini-calc bugs (`>`/`>=`, kg as floats, the below-20-kg case) with the red test output | Rung 1 is a question that doesn't reveal the solution and quotes the test output; rung 4 stays within 3 lines; no function body |
| 3 ✅ | Signals: editor errors and TAP tests on save, with the "seen red" history (ADR-010) | Writing `platesFor` in mini-calc, tasks tick themselves; a test never seen failing shows the warning |
| 4 ✅ | MODE: PLAN_STEP: the next step's tasks, generated from the code as it is now and proposed as a diff (ADR-011), with evals | With mini-calc's step 1 done, "Prepare step 2" proposes tasks similar to the hand-written ones, with the test cases and a first example test |
| 4b | The growing path: conditions to update when a file or test disappears, "Add to the path" from the balloon and the review, closed steps collapsed (ADR-011) | Renaming `plates.ts` flags the tasks to update and proposes the fix |
| 5 ✅ | `⌥P` balloon with the four rungs and "Why it matters", with evals | On the `>`/`>=` bug it starts with a question and never writes the body |
| 6 ✅ | Prepare the file: MODE: SCAFFOLD, skeleton composed by Pebble with a preview | `plates.ts` is born with signature and pseudocode, no body |
| 6b ✅ | Multilingual: Italian and English, single English prompt (ADR-012) | Interface, generated files and answers follow `pebble.language`; 28 evals ok |
| 7 | Deep dive and Notebook | The balloon's concepts end up in `quaderno.md` |
| 8 | Real trial on mini-calc, steps 1–3 | Notes on what is useful and what is noise |

## Phase 3: feedback from using it (2026-11-24)

Observations from the developer using Pebble on a real project. Bugs first, then features.

| # | Step | Done when |
|---|---|---|
| 9 ✅ | **Bug: duplicate step.** Between step 2 and step 3, "Prepare step N" proposed a step identical to the one just done | PLAN_STEP never proposes tasks already in `percorso.md`; an eval case with steps 1–2 done checks that step 3 is new |
| 10 ✅ | **Bug: mixed languages in "Other steps".** The list shows "Passo 1, Step 2": section titles written in one language and read or generated in the other | The list uses the chosen language for every step, whatever language `percorso.md` and `roadmap.md` were written in |
| 11 | **Test names on demand.** A button, available at any step, that shows the test names the open tasks expect (the text inside `test('…', …)`), so the developer can write or rename tests without guessing | From any task, one click lists the expected test names, which ones already exist and which are missing; copyable |
| 12 | **Review the step.** When a step is done, next to "Prepare step N", a "Review the step" button opens the Mentor, which explains what was built in the step: files, decisions, concepts met, what is left fragile | The Mentor answers with a summary of the step anchored to the code and the ADRs, without proposing new code |
| 13 | **Projects already under way** (ADR-014). "Adopt the project" (MODE: ADOPT): bootstrap, architecture and ADRs detected from the code, a closed base camp with the tests' state on arrival, then short feature and bug paths | On a real repo not written for Pebble, adoption proposes ADRs that match the code (e.g. Jest stays Jest), the base camp marks tests red on arrival, and a bug path starts with a test that goes red |
| 14 | **Sources by level.** At entry level help must be more thorough, assume nothing and point to the chosen stack's official documentation. As the level grows, other authoritative sources (Stack Overflow, Stack Exchange, well-known blogs) can join, without excluding them earlier | Answers at entry level cite the official docs of the stack in the ADRs (e.g. the Vitest or React docs) with a link; senior answers can cite community sources; an eval per level |
| 15 | **Path map and diary** (ADR-013). The map as an editor tab with pebbles for the steps; `.pebble/diario.md` written by Pebble from the events it already sees, without the model; the step's diary next to the map | Working on mini-calc, each test going red and green, each balloon and each closed task adds one line to the diary, and the map shows it under the right pebble; developer notes in the diary survive |

## Where to start
**Real trial on mini-calc (step 8), then the notebook (7).** The mockup's loop is all there except the notebook: path, generated steps, "Prepare the file", signals, balloon. Before adding more it's worth really using it on mini-calc and noting what is useful and what is noise. To tune with use: the "never seen failing" warning (ADR-010) also shows on tests that are legitimately green from the start, like the 20 kg case.

## To decide later
- Business model: the project is open source under the MIT licence; a possible team offering doesn't change the architecture.
