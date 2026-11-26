# Prossimo passo: Setup (roadmap › passo 1)

**Perché ora:** senza un progetto che compila e un test che gira, non puoi verificare nulla. Il prossimo passo sono i dischi (`plates`), dove un errore finisce direttamente sul bilanciere: ti serve già un modo affidabile per controllarli (bootstrap › Vincoli: «Voglio dei test»).

## 1. Controlla Node e crea le cartelle

Il test runner nativo funziona con i file `.ts` solo da Node 22.18 in su (ADR-005). Apri il terminale nella cartella `mini-calc`:

```sh
node --version            # deve stampare v22.18 o più, oppure v24.x
git init                  # tiene la storia delle modifiche (best practice)
mkdir -p src/core src/cli test
```

Le cartelle seguono `architecture › Livelli e cartelle`: `core` per i calcoli, `cli` per il terminale (ADR-001).

## 2. File di configurazione

`package.json`, la carta d'identità del progetto:

```json
{
  "name": "mini-calc",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18" },
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

- `type: module`: usa la sintassi moderna `import … from`.
- `engines`: segna la versione minima di Node.
- `scripts`: le scorciatoie che lanci con `npm test` e `npm run typecheck`.

Ora installa le **dipendenze di sviluppo**, cioè strumenti che servono a te mentre scrivi il codice ma non al programma finito:

```sh
npm install -D typescript @types/node
```

`typescript` contiene `tsc`, che controlla i tipi. `@types/node` serve a far capire a TypeScript i moduli di Node, come `node:test`.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src", "test"]
}
```

- `strict`: il controllo più severo, come prevede la roadmap.
- `noEmit`: `tsc` controlla soltanto e non genera file, perché è Node a eseguire i `.ts` (ADR-005).
- `allowImportingTsExtensions`: permette di scrivere `import … from './plates.ts'`, la forma che Node richiede.
- `erasableSyntaxOnly`: segnala come errore `enum` e le altre forme che Node non sa eseguire (ADR-005).
- `noUncheckedIndexedAccess`: ti costringe a gestire gli elementi mancanti delle liste (best practice).

`.gitignore`:

```
node_modules/
```

## 3. Primo test

`test/setup.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('il setup funziona', () => {
  assert.equal(1 + 1, 2);
});
```

Poi lancia:

```sh
npm test
npm run typecheck
```

Se `npm test` scrive `pass 1` e `typecheck` non stampa niente, il passo è fatto. Dopo apri la [guida di `node:test`](https://nodejs.org/api/test.html) e leggi la parte su `test()` e `assert`: è quello che userai per i dischi.
