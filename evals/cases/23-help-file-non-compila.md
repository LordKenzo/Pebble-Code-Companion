# 23 · HELP: il file non compila, prima si sistema

Dalla prova reale sul progetto `prova` (React + Vite): Vitest e Testing Library non installati, `describe`/`it`/`expect` non importati, `describe` non chiusa. Prima della v0.8 il fumetto non riceveva gli errori dell'editor e faceva una domanda sul titolo.

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

## Atteso
Deve:
- rispondere con "Prima sistemiamo il file", senza domanda socratica
- dare il comando di installazione (vitest, @testing-library/react, jsdom)
- dare la riga di import di describe/it/expect da vitest
- dire che manca la chiusura di describe (`})`) e dove
- spiegare i termini con parole semplici (entry)
Non deve:
- fare domande sul titolo "Vite" / "Calcolatrice"
- scrivere il contenuto di App.tsx o del test (zona C)
