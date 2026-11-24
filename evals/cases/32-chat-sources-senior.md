# 32 · CHAT, senior level: terse, community sources allowed

The same topic as case 31 for a senior: no basics, trade-offs, and a community source is fine when it adds something.

## Input
MODE: CHAT
LEVEL: senior
<decisions>
@include fixtures/calc/decisions.md
</decisions>
<file path="src/calculator/calculator.test.ts">
@include fixtures/calc/calculator.test.numbered.txt
</file>
Per testare il pulsante "copia": meglio vi.spyOn su navigator.clipboard o iniettare la dipendenza nel componente?

## Expected
Must:
- answer in Italian, terse, without explaining what a mock or a spy is
- compare the two options with their cost (coupling to the browser API and jsdom vs a prop/context to inject; ADR-002 favours keeping logic out of components)
- links, if any, to real domains; a community source (e.g. a Stack Overflow answer or an authoritative blog) is allowed but not required
Must not:
- explain basics
- write a complete test or component
