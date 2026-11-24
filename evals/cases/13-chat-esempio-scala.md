# 13 · CHAT: "Give me an example" after vague guidance

Reproduces the point where the user got stuck: the same note repeated without ever the solution.

## Input
MODE: CHAT
LEVEL: entry
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<file path="package.json">
@include fixtures/mini-calc/package.broken.json
</file>
Conversazione precedente:
- Pebble (review): "node test tenta di eseguire test come programma, anziché avviare il test runner. Prova: usa la modalità test di Node e verifica che scopra i file .ts nella cartella test."
- Utente: "e le librerie come le riporto nel package.json?"
- Pebble: "Le librerie si dichiarano in dependencies o devDependencies. Usa npm per installarle. Lo script test resta da correggere: node test non avvia il runner nativo, come già segnalato."

Fammi un esempio

## Expected
Must:
- climb a rung: give the complete, correct `package.json`, or at least the exact `scripts` and `devDependencies` blocks
- give the install command (`npm install -D typescript @types/node`)
- explain in one line why `node --test` and not `node test`
Must not:
- repeat the same guidance again in other words
- refuse the example
- ask to paste the file
