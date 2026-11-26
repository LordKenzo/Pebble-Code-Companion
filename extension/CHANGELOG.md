# Changelog

Pebble is in **beta** (pre-release). Versions with an odd minor number (0.7.x) are pre-releases.

## 0.7.37
- **Path tests beyond JavaScript.** In a project without package.json, Pebble picks the command from the manifest and reads its results: `swift test` (XCTest and Swift Testing) with Package.swift, pytest with pyproject.toml or requirements.txt, `go test` with go.mod, `cargo test` with Cargo.toml. Before, it ran `node --test` everywhere and a `test "…"` condition could never tick. A hand-set test command works too, if it prints one of these formats. Swift, Go and Rust get at least five minutes, because the first run compiles.
- **Steps that don't wait for impossible things** (prompt v2.0). No task to create files an init command already writes (`swift package init` makes `.gitignore` too); the name of a generated example test only when it is certain (since Swift 6 it is `example`, not `testExample`), otherwise "manual"; `test "…"` only for the stacks Pebble can run.
- ADR file names and step titles are cut between words: no more `…un-cor.md` or "with 'swift…".

## 0.7.36
- **Pebble looks at the folder before starting.** A manifest or code at its root (package.json, pyproject.toml, go.mod, Cargo.toml, pom.xml, a .csproj or .sln, Gemfile, Package.swift…) means an existing project: *Adopt the project*, as before. Projects inside its subfolders and nothing at the root, like `~/dev`, means a folder of projects: Pebble offers to create a new folder for the new project or to open one of those it found, instead of proposing to adopt everything. A folder with a few files but no code gets the same offer as a link.
- **Create a new folder**: Pebble suggests a name from the bootstrap's title, creates the folder, moves `bootstrap.md` into it if it exists, and opens it. From then on the open folder is the project's root, as the tasks expect.

## 0.7.35
- **Pebble works in the folder you have open.** It no longer asks you to create a project folder and `cd` into it: package.json would have ended up in a subfolder, and no task could have ticked.
- **A new "done when": `script test "vitest run"`.** It ticks when that script in package.json contains the text. Before, a task like "add the test script" was closed by `file package.json`, which already exists after `npm init`. Each task now gets a condition of its own.

## 0.7.34
- **No need to know model names by heart.** In the settings page each ghost's model is a menu with the models of its provider: the known Claude models plus those your account sees, your OpenAI account's models, the models installed on your local server. *Other…* still lets you type a name. Changing a ghost's provider clears its model, since the old name belongs to another list.
- The local server's model list loads by itself, without pressing *Refresh*.

## 0.7.33
- **Each ghost has its colour, as in the banner.** The Mentor stays azure in the chat. The Roadmap ghost is peach in the Path panel and on the map. The ⌥P helper is green, with a green accent in its section, and the help ladder stays the Mentor's azure. Git is lilac in every mood.

## 0.7.32
- **⌥P and Git live in Pebble's sidebar**, as sections next to Path and Mentor, instead of an extra editor column: the code keeps a single column and you switch by opening and closing sections. ⌥P keeps the cursor in the editor; *Got it* hides the section. The Git section appears when a rebase or merge needs you.

## 0.7.31
- **The Git ghost never proposes losing a side.** If the proposed union is the same as one side, Pebble shows it as "keep that side" and warns you. The instructions also say that lines both sides added, such as two tests, are kept both.
- **Unsaved resolutions are flagged.** A file resolved in the editor but not saved still has the markers on disk: the panel says so and offers *Save* before you run `git add`.
- In an untrusted folder the status bar item still shows a rebase or merge in progress, read from the files in `.git` without running git.
- The panel's header wraps better in a narrow column.

## 0.7.30
- **The Git ghost** (ADR-017). When a rebase, a merge or a cherry-pick stops halfway, a status bar item opens a panel beside the code, also from **Pebble: Git**. Without any model call it shows where you are, the files in conflict and the next commands to copy, and it calls the two sides by name, because in a rebase "ours" and "theirs" are swapped.
- **Explain the conflict** sends a single block to the model and proposes a union, which enters the file only when you apply it; in training you get only the explanation. Local cards cover push rejected, lost commits, wrong branch, detached HEAD, stash conflicts and undoing a commit. Pebble runs only read-only git commands, and only in trusted folders.
- The Git ghost is lilac, has its own model in the settings page, and the diary records the conflicts resolved.

## 0.7.29
- **One review.** In the ⌥P panel, *Suggestions on the file* became *Review the file*: the same review as the chat, with severity, line and decision, shown as underlines in the editor and noted in the diary.
- **The chat is for questions.** The `/review`, `/tests`, `/next` and `/init` buttons are gone from the Mentor chat. Typing `/review`, `/tests` or `/init` still works. The next step is in the Path panel and on the map, worked out without the model: `/next` and **What's the next step?** open it.

## 0.7.28
- **A model per ghost**: Roadmap, Mentor and the ⌥P helper can each use their own provider, model and effort, from the settings page; empty means the default. Each one shows the estimated cost of a typical call and the recommendation from the evals.
- The help ladder is now answered by the Mentor's model. In the evals a cheap model handles the ⌥P tabs well, but not the ladder's rules.

## 0.7.27
- **A level per project and per language**: you can be senior in TypeScript and entry in C#. The level is kept per project, on your computer; each language found in the folder can have its own, from the settings page or **Pebble: Set the level**. Pebble uses the level of the file you're working on, plans take all of them into account, and the status bar shows the level of the open file.
- After adopting a project with several languages, Pebble offers to set a level for each.
- The diary notes the level at which Pebble wrote code.

## 0.7.26
- **Pebble writes code when you ask, at every level** (ADR-016). Unasked, it still points and explains; when you ask, the level decides the shape. Entry gets complete code explained line by line, with a question to check it makes sense. Junior gets complete code with the principle behind it. Mid gets lean code with the choices motivated. Senior gets a targeted patch with the trade-off.
- **Show me the code** in the ⌥P help ladder: the corrected code for the red test, once you've seen the rungs.
- **Training** (`pebble.training`, also in the settings page): for those who want to practise. Pebble doesn't write the project's logic even if you insist, and the ladder stops at the exact line.
- The diary records code written by Pebble, so the step review shows what is yours.
- The level descriptions say what each level gets when you ask for code.

## 0.7.25
- **Fewer tokens per call** (ADR-016): each request sends only the part of Pebble's instructions its mode needs, about half the system prompt. In the evals that is 37% fewer input tokens per call, with the same answers.
- **Spending by ghost**: the spending page also shows what Roadmap, Mentor and the ⌥P helper cost, mode by mode.

## 0.7.24
- **⌥P, the help panel** (ADR-015): a short menu, then a panel beside the code, and what you select decides the help. Nothing selected: suggestions on the file, what to study, pseudocode for what is missing (insertable as comments). Code selected: an explanation line by line, what to study, similar examples on a different case. The help ladder stays as one more entry when tests are red. The depth follows your level. The balloon under the line is retired.
- The settings gear sits with the other icons of the Path panel.

## 0.7.23
- **Feature and bug paths**: *New feature* and *New bug* (in the Path panel, its menu and the map) ask for one sentence and prepare a short path of 2–6 tasks from the code as it is now, shown as a diff. A bug path always starts with the test that reproduces it.
- **The map branches out**: paths for features and bugs leave the base camp as branches, each with its card and its diary; the ghost waits by the open one.

## 0.7.22
- **Adopt a project already under way**: when a folder has code but no `.pebble/`, Pebble offers to adopt it. It reads the files, the README, the git history and runs the tests once, then proposes the decisions it finds in the code (*detected, to confirm*), the questions where the code contradicts itself, and a **base camp**: a step 0 already closed, with the tests that were red on arrival. Possible next steps come from the code: a red test, a TODO, a missing test.

## 0.7.21
- **The mentor ghost**: Pebble now has a face. In the balloon and the chat it is neutral when it talks, thoughtful while it waits for the model, worried when the file doesn't compile, happy when you get the answer right; on the map it waits next to the active pebble.

## 0.7.19 · first public beta
- **Path map**: the whole roadmap as a trail of pebbles in an editor tab, with each step's diary next to it. The next step to prepare is highlighted, with its button.
- **Diary** (`.pebble/diario.md`): written by Pebble as you work, without a model: accepted plans, tests turning red and green, balloons and their concepts, closed tasks, reviews. Your own notes stay.
- **Review the step**: from the map or the closed-step card, the Mentor explains what you built and what is still fragile.
- **Test names on demand**: every step lists the test names its tasks expect, with their status, ready to copy.
- **Sources by level**: at entry level Pebble points only to the official documentation of your stack; at higher levels community sources too. It never invents links.
- New icon and visual identity.

## 0.7.10 – 0.7.18
- **English and Italian**, chosen with `pebble.language`; a single English prompt; Pebble answers in the language you write in.
- Planned steps stay inside their roadmap step and don't repeat what is already done.
- Compiler errors reach the balloon, the review and the chat: when a file doesn't compile, Pebble fixes that first.
- Vitest detected from `package.json`; `dependency` conditions; Restricted Mode support.

## 0.7.0 – 0.7.9
- **The Path panel**: tasks tick themselves when your tests and the compiler agree; tests never seen failing are flagged.
- **The `⌥P` balloon**: a help ladder that starts with a question, plus *why it matters* and *deep dive*.
- **Prepare step N** and **Prepare the file**: the next step from the code as it is now, and file skeletons with signatures and pseudocode, shown as diffs.
- Guided start: write `bootstrap.md` with a wizard, then a proposed plan with ADRs.
