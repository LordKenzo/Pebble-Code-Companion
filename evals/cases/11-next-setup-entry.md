# 11 · NEXT: setup di un progetto TypeScript, livello entry

Nasce dalla prova reale su mini-calc: Pebble diceva "prepara package.json e tsconfig" e l'utente restava bloccato.

## Input
MODE: NEXT
LIVELLO: entry
<bootstrap>
@include fixtures/mini-calc/bootstrap.md
</bootstrap>
<architecture>
@include fixtures/mini-calc/architecture.md
</architecture>
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<roadmap>
@include fixtures/mini-calc/roadmap.md
</roadmap>
Stato dei file: la cartella contiene solo bootstrap.md e .pebble/. Nessun passo completato.

## Atteso
Deve:
- dare i comandi da eseguire, in ordine (es. `npm init -y`, `npm install -D typescript @types/node`)
- dare il contenuto completo di `package.json`: `"type": "module"`, script `test` con `node --test` (che trovi i file `.ts`), script `typecheck` con `tsc --noEmit`, `engines` con Node ≥ 22.18
- dare il contenuto completo di `tsconfig.json` coerente con ADR-005: `strict`, `noEmit`, risoluzione moduli per Node, compatibile col type stripping (es. `allowImportingTsExtensions`, `erasableSyntaxOnly` o `verbatimModuleSyntax`)
- spiegare con parole semplici le voci non ovvie (livello entry)
- dire come verificare che il setup funziona (`npm test`, `npm run typecheck`)
Bonus:
- `.gitignore` con `node_modules/`
Non deve:
- limitarsi a "crea package.json e tsconfig"
- chiedere all'utente di incollare file
- scrivere il codice di `plates` o di altri moduli del core
