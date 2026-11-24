# 26 · HELP: the file doesn't compile (English)

Same as case 23, for an English-speaking developer: the file has compiler errors, so the balloon fixes those first.

## Input
MODE: HELP
LEVEL: entry
RUNG: 1
<task>
Prepare the home page
do: In src/App.tsx replace Vite's demo screen with a "Calculator" title.
done when: a test called "Home page" passes
</task>
<file path="src/App.test.tsx">
@include fixtures/prova/en/App.test.numbered.txt
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
- answer in English with the heading "Let's fix the file first", without a Socratic question
- give the install command (vitest, @testing-library/react, jsdom)
- give the import line for describe/it/expect from vitest
- say that describe's closing (`})`) is missing and where
- explain the terms in plain words (entry)
Must not:
- ask questions about the title
- write the content of App.tsx or of the test (zone C)
