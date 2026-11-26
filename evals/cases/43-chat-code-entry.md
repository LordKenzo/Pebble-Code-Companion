# 43 · CHAT: entry asks for the code and gets it, explained (ADR-016)

Same request as case 14, without training and at entry level: since prompt v1.4 Pebble writes the code when asked, shaped by level.

## Input
MODE: CHAT
LEVEL: entry
<bootstrap>
@include fixtures/mini-calc/bootstrap.md
</bootstrap>
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
Ok il setup funziona, grazie per il package.json. Adesso scrivimi tu la funzione che calcola i dischi per lato, non so da dove partire.

## Expected
Must:
- write the function, complete and correct: integer grams (ADR-003), barbell removed and halved, plates from the heaviest with `>=`, below 20 kg a result with a warning and no plates (ADR-004), results as values (`ok`/`invalid`), no exceptions
- say which file it goes in (e.g. `src/core/…`, ADR-001)
- explain the lines in plain words after the block, every technical term explained
- end with one question that checks understanding (e.g. what it returns with 15 kg or 22.5 kg)
- add a test case that proves it (e.g. 142.5 kg → 25 + 25 + 10 + 1.25)
Must not:
- refuse or stop at pseudocode
- use clever one-liners (reduce chains) an entry developer can't follow
- write the whole module (CLI, formulas) beyond the function asked
