<p align="center"><img src="https://raw.githubusercontent.com/LordKenzo/pebble-code-companion/main/assets/banner.jpg" alt="Pebble, the Code Path Companion: a developer at the keyboard and a trail of glowing pebbles through a night forest" width="900"></p>

# Pebble · Code Path Companion

**Walk the path. You write the code.** A pair engineer in VS Code: it turns your project into a path of small steps, prepares each file with signatures and pseudocode, checks your progress with your own tests, and helps you think when you get stuck. It never writes your project's logic for you.

*Leggilo in italiano: [README.it.md](README.it.md).*

## Beta: what to expect
Pebble is a **pre-release**: it works, and it is being built in the open. Before you try it:
- **You need a model.** An Anthropic or OpenAI API key (**Pebble: Set the API key**), or a local server such as Ollama, which is free and keeps your code on your machine. Local models follow Pebble's rules less reliably than cloud models.
- **New or existing projects.** Pebble guides you from `bootstrap.md`, or adopts a project already under way; then works on short paths for single features and bugs.
- **It's honest about checkmarks.** A ticked task means your tests pass, not that your code is correct.
- **No telemetry.** Pebble collects nothing. Your code goes only to the provider you choose.
- Feedback and bugs: [GitHub issues](https://github.com/LordKenzo/pebble-code-companion/issues).

## Getting started
1. Open the **Pebble** view in the activity bar (the pebbles icon), or run **Pebble: Start**.
2. **Tell Pebble about the project**: answer a few questions and Pebble writes `bootstrap.md`, or write it yourself from a guided template.
3. **Propose the plan**: Pebble suggests decisions (ADRs), architecture and roadmap. You read them and save them in `.pebble/`.
4. **Prepare step 1**: the step becomes a checklist of tasks, each saying what it expects.

## What it does
- **The Path panel** reads `.pebble/percorso.md`. Tasks tick themselves when you save: Pebble runs your tests (any runner with TAP output; Vitest is detected from `package.json`), reads the compiler errors VS Code already has, and checks files and dependencies. A test that has never been seen failing is flagged with “!”.
- **What I expect**: every task explains what closes it, with an example of the test name.
- **Prepare the file**: imports, types, the signature and the pseudocode as comments, with an empty body. For a test file, one complete example test and the other cases as `test.todo`. Shown as a diff: **Accept**, **Review and edit**, or **Discard**.
- **Prepare step N**: when a step is done, Pebble plans the next one from your code as it is now.
- **The balloon** (**Alt+P**, Option+P on a Mac, or right click → *Pebble, help me here*): if the file doesn't compile it fixes that first, concretely; otherwise it starts with a question built from your failing test and climbs the help ladder only when you ask (*More concrete*, *Why it matters*, *Deep dive*). You can answer its questions.
- **Test names on demand**: each step lists the test names its tasks expect, with their status (green, red, not found), ready to copy.
- **Adopt a project already under way**: with code but no `.pebble/`, Pebble reads the project and proposes the decisions it finds there, to confirm, and closes a base camp with the state of your tests.
- **The path map** (map icon at the top of the Path panel): the whole roadmap as a trail of pebbles, and next to it each step's **diary**, which Pebble writes in `.pebble/diario.md` as you work, without a model. **Review the step** asks the Mentor what you built and what is still fragile.
- **The Mentor conversation**: free questions, `/review`, `/tests`, `/next`, `/init`. Reviews also appear as editor diagnostics.

## Language
`pebble.language`: `auto` (follows VS Code), `en` or `it`. The interface, the files Pebble writes and the model's answers follow it. You can also change it in **Pebble: Settings**.

## Providers
| `pebble.provider` | What you need |
|---|---|
| `anthropic` (default) | An Anthropic API key (**Pebble: Set the API key**) |
| `openai` | An OpenAI API key and `pebble.openai.model` |
| `local` | A server with an OpenAI-compatible API, no key needed. Ollama: `http://localhost:11434/v1` and e.g. `qwen3-coder:30b` |

Your code is sent to the provider you choose; with `local` it never leaves your machine. Local models are free but follow Pebble's rules less reliably: a cloud model works better for the balloon, the plan and *Prepare the file*.

## Experience level
`pebble.experienceLevel`: `entry`, `junior`, `mid` (default), `senior`. It changes what Pebble flags and how it explains it. At every level Pebble does not write your logic.

## Spending
Every request records the tokens returned by the provider and estimates the cost (Claude prices are built in; set others in `pebble.prices`). The month's total is in the status bar; `pebble.monthlyBudgetUsd` warns you when you go over. **Pebble: Show spending** has the details.

## Restricted Mode
In an untrusted folder Pebble works but doesn't run test commands. Trust the folder to let tasks tick themselves.

## Development
```
npm install
npm test
npm run package
code --install-extension pebble-code-companion-0.7.23.vsix --force
```
The prompt is copied from `../prompts/mentor.md` on every build.
