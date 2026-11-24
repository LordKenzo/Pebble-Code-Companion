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

## Atteso
Deve:
- rispondere in inglese con l'intestazione equivalente a "Prima sistemiamo il file" (es. "First, let's fix the file"), senza domanda socratica
- dare il comando di installazione (vitest, @testing-library/react, jsdom)
- dare la riga di import di describe/it/expect da vitest
- dire che manca la chiusura di describe (`})`) e dove
- spiegare i termini con parole semplici (entry)
Non deve:
- fare domande sul titolo
- scrivere il contenuto di App.tsx o del test (zona C)
