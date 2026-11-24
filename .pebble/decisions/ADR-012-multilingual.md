## ADR-012: Pebble is multilingual, Italian and English today
Status: accepted (updated 2026-11-24)
Context: Pebble was born in Italian, but the repo is public and the launch aims at an international community. An English README promising a product that speaks only Italian is the first obstacle for anyone trying it. The developer must be able to choose the language.
Decision:
- **`pebble.language` setting**: `auto` (default, follows VS Code's language: Italian if VS Code is in Italian, English otherwise), `it`, `en`. Changing it refreshes the panels immediately.
- **Catalogs in `core/i18n.ts`**: one object per language, with the same shape. TypeScript and a test check that every language has all the keys. The Path view receives its catalog together with the model, because data, not functions, crosses into the webview.
- **A single prompt, in English**: `prompts/mentor.md`, with a table of the headings the developer sees in each language (`Gradino N` / `Rung N`, `Prima sistemiamo il file` / `Let's fix the file first`…). Every message to the model carries the `LANGUAGE: it|en` line, which sets the language of every text, schema fields included.
- **Protocol keywords and instructions to the model are in English** (`MODE`, `LEVEL`, `RUNG`, `WHY`, `DEEP_DIVE`, `STEP_TO_PREPARE`, `FILE_TO_PREPARE`, `STEP_SIGNATURES`, `<path>`, `<problems>`): they are the format between extension and model, the same in every language.
- **The developer's own words win in conversation**: when they write to Pebble (a chat question, a reply to the balloon) Pebble answers in the language they wrote in. What goes into the project's files always follows `LANGUAGE`. The exception is written both in the prompt and in the `LANGUAGE` line, because the line, coming last, otherwise wins.
- **What Pebble writes into files** (sections of `percorso.md`, skeletons, bootstrap, example path, `.pebble/` from INIT) follows the chosen language. The path parser reads both languages (`fare`/`do`, `fatto quando`/`done when`, `a mano`/`manual`…), so a path written in one language stays valid in the other.
- The reasons for an open task carry a **code** (`testMissing`, `fileMissing`…): the view decides what to show from the code, not from the sentence.
- **Command titles, views and setting descriptions** live in `package.nls.json` (English) and `package.nls.it.json`: these follow VS Code's language, as VS Code's mechanism requires.
- **Pebble's own documents** (ADRs, roadmap, eval report, code comments over time) are in English only.
Alternatives ruled out:
- translating only the interface (the model would answer in the prompt's language);
- two aligned prompts, Italian and English (tried until 2026-11-24: the evals showed that the English prompt with `LANGUAGE: it` answers in Italian with the same quality, and two copies drift at the first hurried change);
- `vscode.l10n` for everything (it follows only VS Code's language, while we want a Pebble setting; it stays for the command titles in `package.json`);
- bilingual internal documents (double the work, and the copies drift).
Consequences: every new user-facing sentence must be written in two languages; rules for the model are written once. Evals include English cases (24–28) and run with the `LANGUAGE` line like the extension. Local models follow English instructions better, which is one more reason for the single prompt.
