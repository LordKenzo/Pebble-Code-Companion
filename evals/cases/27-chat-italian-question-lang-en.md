# 27 · CHAT: domanda in italiano, progetto in inglese

Il progetto è in inglese (`LANGUAGE: en`), ma lo sviluppatore scrive in italiano: la risposta va in italiano.

## Input
MODE: CHAT
LEVEL: junior
<decisions>
@include fixtures/mini-calc/en/decisions.md
</decisions>
<file path="src/core/units.ts">
@include fixtures/mini-calc/en/units.numbered.txt
</file>
Perché nell'ADR-003 lavoriamo in grammi interi invece che in kg con i decimali? Non mi è chiaro cosa cambia.
LANGUAGE: en — write in English every text, schema fields included; only if the developer's own message is in another language, answer them in that language (project files stay in English).

## Atteso
Deve:
- rispondere in italiano, perché la domanda è in italiano
- spiegare il problema dei float (0,1 + 0,2) e il legame con i carichi "quasi" componibili, citando ADR-003
Non deve:
- rispondere in inglese
- proporre di cambiare l'ADR
