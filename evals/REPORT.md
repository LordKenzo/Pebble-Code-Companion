# Eval results

Run with `python3 evals/run.py`: Claude Code in headless mode, with only the system prompt, no tools and no context from the development conversation. The full answers are in `runs/`.

Many cases are in Italian, because Pebble was born in Italian: their inputs stay as they are, and Italian quotes below (e.g. `Gradino 1 · Domanda`) are the actual output. Since v1.0 there is a single English prompt and the runner adds the `LANGUAGE` line as the extension does.

## Prompt v0.1 (`runs/2026-11-23_0946`)

| Case | Result | Notes |
|---|---|---|
| 01 full INIT | ✅ with reservations | All the required points, plus the bonus on Monday concurrency. But ADRs inside code blocks, two questions, about 1,200 words |
| 02 vague INIT | ✅ with reservations | Stops and doesn't invent requirements. But adds a list of other requests to the question |
| 03 NEW_FILE domain | ✅ | Role, what to avoid with ADR-002, a single signature |
| 04 NEW_FILE out of place | ✅ | Says the file doesn't belong in domain and proposes port + adapter. Bonus: asks whether the booking stays valid when the email isn't sent |
| 05 REVIEW with defects | ✅ | Finds pg, the exception and `Date.now()`, plus the race condition. Notes inside code blocks |
| 06 REVIEW clean file | ⚠️ | Inflated severity: "warning" for an unused parameter, plus a second generic note |
| 07 REVIEW race condition | ✅ | The race as first note, with error severity and anchored to the bootstrap and ADR-003. Also finds all the bonuses (unused `clock`, non-atomic writes, waiting list) |
| 08 TESTS | ✅ | Edge cases first, a test that drives the waiting list, a note on the integration test for concurrency |
| 09 CHAT under pressure | ✅ | Refuses in one sentence, proposes an in-memory adapter for the demo, solid checklist |
| 10 CHAT workaround, in English | ✅ | Answers in English, no complete test, only one example line |

The decisive criterion, *"at least one note I wouldn't have found myself"*, is met in 01, 04, 05, 07 and 08.

## Fixes in v0.2

1. Notes and ADRs in plain text, never inside code blocks (also needed to extract notes reliably).
2. At most one question per answer, in total.
3. Length guidance (about 60 words per note, 700 for INIT, 300 for the other modes).
4. Severity redefined, with the rules "when in doubt, the lowest" and "file is fine = one line plus at most one info note".

## Prompt v0.2 (`runs/2026-11-23_0948`, cases 01, 02, 05, 06)

| Case | Result | Notes |
|---|---|---|
| 01 | ✅ | ADRs in text, no superfluous questions. Still long (about 920 words against the 700 indicated) |
| 02 | ✅ | A single question |
| 05 | ✅ | Three notes in plain text. Merged pg and the exception to make room for the race condition, the right choice |
| 06 | ✅ | A confirmation line plus an info note |

## Local model (extension v0.1, qwen3-coder:30b via Ollama)

| Case | Result | Notes |
|---|---|---|
| 05 REVIEW with defects | ✅ with reservations | Finds pg, the exception and `Date.now()` in 16 s. Imprecise lines (3 instead of 1), ADR proposed in long form, no race condition |
| 07 REVIEW race condition | ❌ | A single "general info" note on the separate writes. Doesn't see the race, which is exactly the valuable note |

Conclusion: local is fine for obvious ADR violations, not for the notes that justify the product. To be made clear in the settings.

## OpenAI (extension v0.2, gpt-6.2-sol)

| Case | Result | Notes |
|---|---|---|
| 07 REVIEW race condition | ✅ | The race as first note (error, ADR-003), the waiting list as second. 12 s, 2,619 tokens in, 460 out |
| 05 at entry level | ✅ after a fix | Before the fix it was almost identical to senior. With the level reminder in the message: terms explained in brackets, numbered steps, what's good in the summary |
| 05 at senior level | ✅ | Terse notes, alternatives with their cost (row lock or conditional update). Also found the exact-12-hours edge |

Lesson: level instructions must be repeated next to the request, not only in the system prompt.

## Prompt v0.4 (`runs/2026-11-23_1810`, `_1812`, `_1813`)

Born from the real trial on mini-calc (extension v0.5, gpt-6-sol). Pebble said "prepare package.json and tsconfig" without ever showing how. Asked for an example, it repeated the same note and attributed npm's rules to ADR-005 as well. Best practices never came up.

Changes:
1. **Three zones.** A, commands and configuration: complete. B, structure: concrete proposals, with a declarations-only block of up to 20 lines. C, logic: the ban stays.
2. **Help ladder.** Hint, precise direction, example, exact line. "Give me an example" climbs one rung.
3. **Best practices always flagged**, anchored to `best practice` and not to an ADR.
4. **Project phase.** Proactive at the start, Socratic in the logic, a design companion in decisions.
5. **Use the context you have**: it doesn't ask to paste files it already has.
6. The `core/policy` filter and the `run.py` check let through configuration, commands (not heredocs or `node -e`), trees and declarations-only blocks.

| Case | Result | Notes |
|---|---|---|
| 11 NEXT setup, entry (new) | ✅ | Commands in order, complete package.json, tsconfig and .gitignore with the entries explained, check with `npm run check`. Before: "create the files" |
| 12 REVIEW package.json (new) | ✅ with reservations | Exact corrected line, install command, complete files, `best practice` where needed. The glob points at `src/` instead of `test/` as in the architecture |
| 13 CHAT "Give me an example" (new) | ✅ | Climbs a rung: complete package.json with each entry explained. Invents the project name ("one-rep-max") |
| 14 CHAT protected logic (new) | ✅ | Refuses the function, gives the signature, the analogous coin-change example, a checklist with the ADRs and the tests to start from |
| 01–10 (regression) | ✅ | No logic blocks. 02 stays at one question, but with two options and a recommendation. 03 and 09 propose signature-only skeletons (allowed by zone B). 01 is still long (about 1,000 words) |

Limit: the evals run with Claude (`claude -p`), while the mini-calc trial used gpt-6-sol. To be repeated in the extension with the provider you use.

## Prompt v0.5: the balloon, MODE: HELP (`runs/2026-11-23_2025`, `_2026`)

Roadmap step 2b: the highest risk (asking useful questions instead of giving answers) checked before building the interface. Three real mini-calc bugs with the red test output (fixtures in `fixtures/mini-calc/src/`):
- `>` instead of `>=` in the plates loop;
- kg as floating point: `175 * (70 / 100)` gives 122.49999999999999 and the load drops to 120;
- the missing below-20-kg case.

| Case | Result | Notes |
|---|---|---|
| 15 rung 1, cursor on the wrong line | ✅ after a fix | Before: a great question on 22.5 kg, but the final line "Concept: boundary error" gave the answer away. After: a question on the value 20,000 at the while line, no concept |
| 16 rung 4 | ✅ | One line of code (`>=`), explains the 60 kg output. Proposes a property test ("the plates add back up to the total"), better than the expected one |
| 17 rung 1, floating point | ✅ after a fix | The question asks to print `targetKg` "digit by digit". Before the fix it revealed "floating-point arithmetic" in the Concept line |
| 18 rung 2, entry | ✅ with reservations | Clear direction, terms explained, cites ADR-004 and suggests looking at `result.ts`. About 120 words against the 90 indicated |
| 19 deep dive | ✅ with reservations | Concept, habit and exercise (free shipping from €50) well done, no fix. About 160 words against 140; doesn't mention the greedy algorithm |

Prompt fix: the Concept line only from rung 2; at rung 1 the question may say where to look, not what is wrong.

Open: length at entry level tends to overflow; to recheck with gpt-6-sol in the extension, because these evals run with Claude.

## Prompt v0.6: the next step, MODE: PLAN_STEP (case 20)

Roadmap step 4: Pebble breaks down the next step from the code as it is now (ADR-011). The case uses mini-calc with the setup already done and asks for step 2.

| Run | Result | Notes |
|---|---|---|
| First | ⚠️ broken case | The path pasted into the case contained "## Passo 1", and the runner cuts the Input section at the first line starting with "## ". Moved into an included fixture |
| Second | ✅ with reservations | Doesn't repeat the setup, adds the missing `units` module (ADR-003), tests before the implementation, anomalies as outcomes (ADR-004), final "Review with Pebble". But the names in the conditions ("22,5 kg in grammi") didn't appear among the cases of the tests task: the task would have stayed on "test not found" |
| Third, after the fix | ✅ | Exact test names in quotes in the tests task, conditions with their leading part. Checked with `planToSection` and `testNameMatches`: no condition dropped, every name in the conditions matches a listed case |

Prompt fix: in the tests task the cases are exact names in quotes, starting with the case's data; `test "…"` conditions use the part before the colon.

Runs: `runs/2026-11-23_2057`, `runs/2026-11-23_2058`, `runs/2026-11-23_2059`.

## Prompt v0.7: "Prepare the file", MODE: SCAFFOLD (cases 21, 22)

Roadmap step 6. The model returns the skeleton's parts, Pebble composes the text with `composeScaffold` and drops any part with logic: non-literal constants, types with bodies, signatures with a body, more than one complete test.

| Case | Result | Notes |
|---|---|---|
| 21 skeleton of src/core/plates.ts | ✅ | Imports with `.ts`, constants in grams from the bootstrap, `PlateLoad`, `platesFor`'s signature, six pseudocode steps with the ADRs, the question "work out 142.5 kg by hand". No part dropped |
| 22 test file, first run | ⚠️ | A single example test and the others as `test.todo`, but it called `platesPerSide`: the expected name (`platesFor`) was in another task of the step and `plates.ts` didn't exist yet |
| 22 after the fix | ✅ | With the step's expected signatures (then `FIRME PREVISTE NEL PASSO`, now `STEP_SIGNATURES`) it uses `platesFor`. Example on the 15 kg case (warning), the other four cases as `test.todo`. No part dropped |

Fix: the message carries the signatures expected by the step's other tasks, and the prompt asks to use them exactly.

## Prompt v0.8: editor errors first (case 23, real trial)

From the real trial on the `prova` project (React + Vite, with local qwen3-coder). Vitest and Testing Library weren't installed, the install task had ticked because of a too-weak condition ("package.json exists"), and the test didn't compile. Balloon and review didn't receive the editor's errors: the balloon asked a question about the title, the review claimed a missing import that was there.

Fixes: a `<problems>` block with the editor's errors in the balloon and the review; in the balloon, "Prima sistemiamo il file" / "Let's fix the file first" with concrete fixes before any question; the `dependency name` condition; the test command chosen from package.json (Vitest with `--reporter=tap-flat`).

| Run | Result | Notes |
|---|---|---|
| Case 23 with Claude | ✅ | Install, import from vitest, the bracket to close with its line, terms explained for entry level. No question, no App.tsx code |
| Same message with qwen3-coder:30b, balloon | ✅ with reservations | With the errors in context it finds the install and the bracket, but doesn't follow the format (numbers the points as "Gradino 1, 2, 3") and writes App.tsx's content (zone C) |
| Same message with qwen3-coder:30b, review | ⚠️ | No longer contradicts the errors, but proposes Jest in a Vite project that plans Vitest, and returns "try" as a list instead of text (in the extension the structured schema prevents this) |

Conclusion: the right context helps a lot even for the local model, but for the balloon and generated steps a cloud model is still more reliable at respecting the zones.

## Prompt v0.9: English and Italian (ADR-012)

English prompt (`mentor.en.md`) translated rule by rule from the Italian one, plus a language line in every message. Tried with Claude on two existing cases, with Italian code and test names and English requested:

| Case | Result | Notes |
|---|---|---|
| 23 file that doesn't compile | ✅ | "Let's fix the file first": install, import from vitest, bracket to close, terms explained for entry level |
| 15 rung 1 | ✅ | One question on the 60 kg test and the while line, without naming the solution or the concept |

## 2026-11-24 · protocol in English (`runs/2026-11-24_0902`)
Protocol keywords to the model (`LEVEL`, `RUNG`, `WHY: yes`, `DEEP_DIVE: yes`, `STEP_TO_PREPARE`, `FILE_TO_PREPARE`, `STEP_SIGNATURES`, `LANGUAGE`, `<path>`) and schema instructions in English. 23/23 cases ok, no regressions: answers stay in Italian with `LANGUAGE: it`, rungs and headings (`Gradino 1 · Domanda`, `Approfondimento · …`) unchanged, skeletons with Italian comments.

## 2026-11-24 · English cases and the "single prompt" trial
New cases 24–26 in English (fixtures translated in `fixtures/*/en/`). The runner adds the `LANGUAGE` line as the extension does.

- **Italian prompt** (`runs/2026-11-24_0909`): 26/26 ok. The English cases answer in English with English headings (`Rung 1 · Question`, `Let's fix the file first`) and English pseudocode.
- **English prompt** (`runs/2026-11-24_0910_prompt-en`): 25/26 ok. On the 23 Italian cases, with `LANGUAGE: it`, it always answers in Italian, with the same quality: the same rung-1 question, the same three fixes on the file that doesn't compile, the same refusal with zones A/B under pressure.
  - Headings sometimes drift from the expected text: `Sistemiamo prima il file` instead of `Prima sistemiamo il file`, `Deep dive · …` instead of `Approfondimento · …`. The parser doesn't depend on headings (it only reads `Concetto/Concept`), but the user sees them.
  - Case 14: in the proposed signature it puts two constants with their value (`const BILANCIERE_G = 20000`), beyond zone B's limit. Minor, but the Italian prompt doesn't do it.

Conclusion: a single English prompt is viable, provided the headings per language are fixed in a table and it's explicit that in zone B constants have no value outside SCAFFOLD.

## 2026-11-24 · single prompt v1.0
A single `prompts/mentor.md`, in English, with the table of headings per language. New cases 27 (`en` project, question in Italian) and 28 (`it` project, reply to the balloon in English).

- First run (`runs/2026-11-24_0916`): 27/28. Exact headings everywhere, but case 27 answered in English: the `LANGUAGE` line at the end of the message won over the exception written in the prompt. Case 14 flagged for `export declare const …`, which is a declaration: the check and the extension's filter were fixed.
- Second run (`runs/2026-11-24_0918`), with the exception also written in the `LANGUAGE` line: **28/28 ok**, the right language in every case, headings from the table (`Gradino 1 · Domanda`, `Prima sistemiamo il file`, `Answer · right`).

## Open

- INIT is still over the indicated length: consider splitting the answer (decisions first, then roadmap and folders on request).
- The automatic check only verifies code blocks (with the zone A and B exceptions). The rest, for now, is judged by hand against each case's expectations.
- No cases yet on languages other than TypeScript or on projects without `.pebble/`.
- The single-prompt runs were done with Claude only; local models (qwen3-coder) still need checking with English instructions.

## 2026-11-24 · plan step scope (cases 29, 30, `runs/2026-11-24_1455`)
From real use on a React calculator: step 2 ("describe with tests") was generated with an implementation task, and step 3 ("write the operations") then proposed the same implementation again. The prompt now says to stay inside the roadmap step and not to repeat what `<path>` or the code already cover, and to write conditions in the project's language.

| Case | Result | Notes |
|---|---|---|
| 29 tests-only step | ✅ | Tests, signatures and "run them and read why they fail"; `reading` says the operations come in step 3. Italian conditions |
| 30 step already done | ✅ | `reading` says `calculate` and its tests already exist from step 2; proposes only the missing tests (invalid input on line 4, negatives, decimals) and the review |
| 20 (regression) | ✅ | Same quality as before; the review task is titled "Revisione con Pebble" instead of the expected "Rileggi con Pebble" |

## 2026-11-24 · sources by level, prompt v1.1 (cases 31–33, `runs/2026-11-24_2124`)
The prompt now says where to send the developer to read more: at entry level only the official documentation of the stack in the ADRs, saying which section to open; junior adds well-known references such as MDN; mid and senior may cite community sources when they add something. Never an invented URL: prefer a guide's start page or the name of the section.

| Case | Result | Notes |
|---|---|---|
| 31 chat, entry | ✅ | Explains "mock" with an everyday comparison and links it to jsdom having no clipboard. Points to *vitest.dev › Guide › Mocking* and *testing-library.com › user-event › Clipboard*; no Q&A sites, no deep URLs |
| 32 chat, senior | ✅ with reservations | No basics, the two options with their cost, a better third way (`user-event`) with a 2-line fragment and a declaration-only module. No community source (allowed, not required). Long for senior, about 300 words |
| 33 deep dive, entry | ✅ | Floating point in plain words, a habit tied to ADR-003 and an exercise in the Node console; no reading pointer (allowed) |
| 14, 15, 19, 23 (regression) | ✅ | Unchanged |

## 2026-11-25 · MODE: ADOPT, prompt v1.2 (cases 34, 35, `runs/2026-11-25_0913`)
Adopting a project already under way (ADR-014). Two projects not written for Pebble, built as fixtures with something planted in each.

| Case | Result | Notes |
|---|---|---|
| 34 React + Jest, Italian | ✅ | Jest stays Jest (Vitest never appears). Five decisions with evidence down to the line. Finds the planted conflict (`addTodo` throws, `fetchTodos` returns `{ ok: false }`) as one question. First path: the red test, explained (key "todos" vs "todo-list") and marked as red before Pebble arrived; also the retry TODO |
| 35 Flask + pytest, English | ✅ | Six decisions (blueprints, services layer, `OrderError` → 400, Decimal, commits in services, pytest-flask). No invented conflict; it raises a real one (a malformed payload returns 500). Links the red test to the 50% cap TODO; asks whether `db` is Flask-SQLAlchemy, missing from the dependencies |
| 01, 20 (regression) | ✅ | Unchanged |

Reservation: `unknowns` lists up to 6 points instead of the 1–4 asked.

## 2026-11-25 · feature and bug paths (cases 36, 37, `runs/2026-11-25_1008`)
`PATH_TO_PREPARE: feature|bug · …` instead of `STEP_TO_PREPARE`: a short path from one sentence by the developer (ADR-014).

| Case | Result | Notes |
|---|---|---|
| 36 bug, Italian | ✅ | `reading` locates the cause (floating point in `a + b`, line 6) without the fix. Tasks: test that reproduces the bug, fix, nearby edge cases, review. Nothing outside the bug. The first task closes on "no errors in the test file": conditions measure green, and seeing the test red first is tracked by the diary (ADR-010) |
| 37 feature, English | ✅ | Six tasks in English: user-event, tests of the button, a separate component (ADR-002), disabled on an error message, a clipboard failure shown as a message (ADR-003 spirit), placement, review |
| 20, 29, 30 (regression) | ✅ | Unchanged |

## 2026-11-25 · MODE: ASSIST, prompt v1.3 (cases 38–42, `runs/2026-11-25_1114`)
The ⌥P help panel (ADR-015): one structured answer per tab.

| Case | Result | Notes |
|---|---|---|
| 38 tips, mid | ✅ | Three points with lines and values: the missing below-the-bar case (15 kg, ADR-004), the silent remainder (61 kg), the empty `loadsFor` without a return type |
| 39 explain, entry | ✅ | Explains loop, `while`, `>=` and `-=` the first time; traces 142.5 kg disc by disc; summary with the coin analogy |
| 40 explain, senior | ✅ | Terse; names greedy, the silent remainder and when dynamic programming would be needed. It says greedy is always minimal with these plates: verified exhaustively up to 400 kg per side (the mockup had it wrong) |
| 41 pseudo, junior | ✅ after a fix | First run: correct but long steps, too heavy as code comments. Now each step is one short line, the reasons go in `intro` |
| 42 similar, English | ✅ | Coins and seconds with numeric traces; a variation shows the same silent remainder |
| 15 (regression) | ✅ | Unchanged |

## 2026-11-26 · prompt cut per mode, ADR-016 (all cases, `runs/2026-11-26_1321`; whole-prompt comparison `runs/2026-11-26_1323`)

Each call now gets the core of the prompt plus only its mode's section. All 42 cases ran with the cut prompt: no code block over the limit, the structured modes still answer with their schemas, and the answers checked by hand still meet their cases (e.g. 02 stops on one question, 06 a single info note, 16 only the line-20 fix, 19 under the limit with a different exercise, 23 "Prima sistemiamo il file", 28 in English, 30 only what is missing, 36 the failing test first, 41 short steps for `loadsFor`).

Same four cases, cut prompt against whole prompt:

| Case | System chars | Tokens in | Cost |
|---|---|---|---|
| 06 REVIEW clean file | 13,154 vs 27,541 | 5,842 vs 10,822 | $0.027 vs $0.101 |
| 15 HELP rung 1 | 15,283 vs 27,541 | 8,188 vs 12,455 | $0.071 vs $0.107 |
| 20 PLAN_STEP | 15,194 vs 27,541 | 8,898 vs 13,141 | $0.132 vs $0.163 |
| 38 ASSIST tips | 13,565 vs 27,541 | 7,888 vs 12,763 | $0.090 vs $0.129 |
| **total** | | **30,816 vs 49,181 (−37%)** | **$0.320 vs $0.499 (−36%)** |

Costs depend on what the cache already held when each case ran, so the token column is the steadier measure: about 4,300–5,000 fewer input tokens per call. The whole run of 42 cases cost $2.59.

## 2026-11-26 · code on request at every level, prompt v1.4, ADR-016 (all cases, `runs/2026-11-26_1332`)

Pebble now writes code when asked, shaped by level. The old refusal survives under `TRAINING: yes`, which cases 09 and 14 now carry.

| Case | Result | Notes |
|---|---|---|
| 09 CHAT under pressure, training | ✅ | Refuses the adapter in one sentence, then dependencies, a declarations-only skeleton and the directions. Longest block 3 lines |
| 14 CHAT logic protected, training | ✅ | Refuses the body, gives structure, a first-rung question and the checklist |
| 10 CHAT "show me a test", in English | ✅ (expectation updated) | A complete example test in the project's style, boundary case included. Under v1.4 asking to see a test is a request for code; the case's expectation now says so |
| 43 CHAT code at entry | ✅ with reservations | Complete function with `>=`, integer grams and the file path; every line explained in plain words; tests; it ends with "cosa restituisce `dischiPerLato(62_500)`?". But it returns a bare array and leaves the below-bar warning to the caller instead of a `Result` (ADR-004) |
| 44 CHAT code at senior, in English | ✅ | A diff on their file (`>=` plus `invalid(…)` on a leftover), the alternative (an upfront modulo guard) with its trade-off, four tests. Bonus: spots that the bar-only branch returns more than the target, against ADR-003 |
| 45 HELP *Show me the code*, mid | ✅ | **Il codice**, the corrected `platesFor` in their names, what changed in one paragraph, delicate spots, a test (47.5 kg) that fails with `>` |
| 46 HELP *Show me the code*, training | ✅ with reservations | Stays at the exact line, says why in one sentence without preaching. The trace of its suggested test is wrong: with `>` 70 kg gives 20 + 2.5 + 1.25, not 20 + 5 |

The rest of the cases didn't change behaviour. The automatic check flags 01 (a folder tree in an unlabelled block) and 11 (complete `package.json` and `tsconfig`, plus the trivial 5-line setup test): zone A, allowed by the extension's filter. The cut prompt is about 1,900 characters longer than with v1.3, from the level and training rules; the whole run cost $2.87.

## 2026-11-26 · levels per language, prompt v1.5, roadmap #23 (cases 43, 47, `runs/2026-11-26_1348`)

| Case | Result | Notes |
|---|---|---|
| 47 CHAT, C# at entry and TypeScript at senior in one answer | ✅ | The C# method is complete (`decimal`, `foreach`, `Math.Round` with `AwayFromZero`), every term explained in plain words, three tests with values, a closing question. The TypeScript type is four lines with two terse notes (camelCase from System.Text.Json; `decimal` → `number`, so totals stay on the backend or travel as strings). Nothing in the TypeScript part is explained at entry depth |
| 43 CHAT code at entry (rerun) | ✅ | This time it returns a result with an outcome (`ok` / `avviso`) as ADR-004 asks, and the test traces 84 kg → 82.5 kg correctly |

## 2026-11-26 · a model per ghost, roadmap #20 (`runs/2026-11-26_1353`, `runs/2026-11-26_1354`)

The same cases on cheaper models, to back the recommendations in the settings page with data.

| Ghost · model | Cases | Result | Cost per call |
|---|---|---|---|
| Roadmap · Sonnet | 20, 29, 30, 34, 36 | ✅ all five. 30 also notices that `Infinity` slips through the input check; 34 reads the red test on arrival correctly | about $0.065 (Opus: $0.07–0.13) |
| Mentor · Sonnet | 05, 06, 07, 09, 13, 31, 43, 44, 47 | ✅ all nine, code on request included (43 keeps the below-bar warning as a result, 47 keeps the two levels apart) | about $0.039 |
| Mentor · Haiku | 05, 06, 07, 09, 13, 43 | ⚠️ reviews and the training refusal hold; at entry, 43 forgets the below-bar case (ADR-004) and returns plates for a negative remainder | about $0.002 |
| ⌥P tabs · Haiku | 38, 39, 40, 41, 42 | ✅ tips, explain and similar hold; ⚠️ 41's pseudocode steps are long sentences, not one short line each | about $0.002 |
| Help ladder · Haiku | 15, 16, 23, 28, 45 | ❌ 15 reveals the cause at rung 1 and adds a Concept line; 16 traces the 70 kg test wrongly; 23 asks a question instead of "Prima sistemiamo il file"; 28 replies in Italian with a rung instead of **Answer · right** | about $0.002 |

Decisions:
- **The help ladder moves to the Mentor**: its rules are the most protocol-heavy, and a cheap model breaks them.
- **The ⌥P helper keeps the tabs**, where a cheap model holds.
- **Recommended**: Roadmap a strong model at high effort, and Sonnet was enough. Mentor a mid, low-cost model at medium effort (Sonnet). ⌥P helper a cheap or local model at low effort (Haiku).
