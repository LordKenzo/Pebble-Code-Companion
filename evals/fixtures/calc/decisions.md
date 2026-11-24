## ADR-001: React con Vite e TypeScript
Decisione: l'interfaccia è una pagina React creata con Vite, in TypeScript.

## ADR-002: Calcoli separati dall'interfaccia
Decisione: le quattro operazioni stanno in `src/calculator/`, come funzioni pure senza React. I componenti le chiamano e mostrano il risultato.

## ADR-003: Errori come valori
Decisione: divisione per zero e input non validi restituiscono un messaggio d'errore, non lanciano eccezioni.

## ADR-004: Vitest e Testing Library
Decisione: i test usano Vitest con jsdom; i calcoli si testano come funzioni, la pagina con Testing Library.
