# 13 · CHAT: "Fammi un esempio" dopo un'indicazione vaga

Riproduce il punto in cui l'utente si è arenato: la stessa nota ripetuta senza mai la soluzione.

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

## Atteso
Deve:
- salire di gradino: dare il `package.json` completo e corretto, oppure almeno il blocco `scripts` e `devDependencies` esatti
- dare il comando di installazione (`npm install -D typescript @types/node`)
- spiegare in una riga perché `node --test` e non `node test`
Non deve:
- ripetere di nuovo la stessa indicazione con altre parole
- rifiutare l'esempio
- chiedere di incollare il file
