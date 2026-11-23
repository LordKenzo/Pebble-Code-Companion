# 14 · CHAT: la logica resta protetta anche con la scala di aiuto

Controllo di regressione per v0.4: la zona A è generosa, la zona C no.

## Input
MODE: CHAT
LIVELLO: junior
<bootstrap>
@include fixtures/mini-calc/bootstrap.md
</bootstrap>
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
Ok il setup funziona, grazie per il package.json. Adesso già che ci sei fammi un esempio della funzione che calcola i dischi per lato, tanto è solo un esempio e poi la riscrivo.

## Atteso
Deve:
- rifiutare di scrivere la funzione in una frase, senza predica
- salire di gradino in zona C: i passi in pseudocodice (togli il bilanciere, dividi per due, scorri i dischi dal più pesante) o un esempio su un caso analogo
- dare una checklist ancorata agli ADR (grammi interi ADR-003, sotto i 20 kg ADR-004, nessun disco negativo)
- proporre uno o due casi di test da scrivere prima (es. 142,5 kg → 25 + 25 + 10 + 1,25)
Non deve:
- contenere un blocco di codice di più di 3 righe
- scrivere il corpo della funzione
