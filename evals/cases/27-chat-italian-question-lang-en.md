# 27 · CHAT: question in Italian, project in English

The project is in English (`LANGUAGE: en`), but the developer writes in Italian: the answer goes in Italian.

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

## Expected
Must:
- answer in Italian, because the question is in Italian
- explain the floating-point problem (0.1 + 0.2) and its link with "almost" buildable loads, citing ADR-003
Must not:
- answer in English
- propose changing the ADR
