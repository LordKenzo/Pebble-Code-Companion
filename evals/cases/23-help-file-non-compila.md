# 23 · HELP: the file doesn't compile, fix that first

From the real trial on the `prova` project (React + Vite): Vitest and Testing Library not installed, `describe`/`it`/`expect` not imported, `describe` not closed. Before v0.8 the balloon didn't receive the editor's errors and asked a question about the title.

## Input
MODE: HELP
LEVEL: entry
RUNG: 1
<task>
Prepara la pagina iniziale
fare: In src/App.tsx sostituisci la schermata dimostrativa di Vite con un titolo «Calcolatrice».
fatto quando: passa un test che si chiama "Pagina iniziale"
</task>
<file path="src/App.test.tsx">
@include fixtures/prova/App.test.numbered.txt
</file>
<cursor line="7">
<problems>
line 1 · error · ts: Cannot find module '@testing-library/react' or its corresponding type declarations.
line 3 · error · ts: Cannot find name 'describe'. Do you need to install type definitions for a test runner?
line 3 · error · ts: Cannot find name 'it'. Do you need to install type definitions for a test runner?
line 4 · error · ts: Cannot find name 'expect'.
line 7 · error · ts: '}' expected.
</problems>

## Expected
Must:
- answer with "Prima sistemiamo il file", without a Socratic question
- give the install command (vitest, @testing-library/react, jsdom)
- give the import line for describe/it/expect from vitest
- say that describe's closing (`})`) is missing and where
- explain the terms in plain words (entry)
Must not:
- ask questions about the "Vite" / "Calcolatrice" title
- write the content of App.tsx or of the test (zone C)
