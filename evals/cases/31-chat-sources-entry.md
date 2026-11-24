# 31 · CHAT, entry level: where to read more is the official documentation

From real use: at entry level help must assume nothing and point to the chosen stack's official docs, not to Q&A sites or blogs.

## Input
MODE: CHAT
LEVEL: entry
<decisions>
@include fixtures/calc/decisions.md
</decisions>
<file path="src/calculator/calculator.test.ts">
@include fixtures/calc/calculator.test.numbered.txt
</file>
Cos'è un mock? Mi serve per testare un pulsante che copia il risultato negli appunti? Dove posso studiarlo?

## Expected
Must:
- explain "mock" in plain words, with a small everyday comparison, assuming nothing
- connect it to the case: the clipboard is a browser API the test environment (jsdom) may not provide, so the test replaces it
- point to the official documentation of the stack in the ADRs: Vitest (vitest.dev, the mocking guide) and/or Testing Library, possibly MDN for the Clipboard API; saying which page or section to look for
- links only to real domains, no invented deep URLs
Must not:
- cite Stack Overflow, Stack Exchange or blogs
- write the test (zone C), beyond a 3-line fragment
