# Prossimo passo: 1 · Setup

**Perché adesso:** prima di scrivere il calcolo serve un progetto che compila e un test che passa. Così, quando scriverai `plates`, saprai che un test rosso dipende dal tuo codice e non dalla configurazione (roadmap › Da dove partire).

## 1. Controlla Node e crea il progetto

Il type stripping di Node fa girare i file `.ts` senza compilarli prima, e richiede Node 22.18 o più recente (ADR-005). Controlla la versione con il primo comando. Se esce un numero più basso, aggiorna Node prima di continuare.

```sh
node --version
git init
npm init -y
npm install -D typescript @types/node
mkdir -p src/core src/cli test
```

Una **dipendenza** è codice scritto da altri che serve al tuo progetto. `-D` vuol dire "serve solo mentre sviluppi". `typescript` controlla i tipi, `@types/node` gli spiega com'è fatto Node (best practice). Le cartelle seguono l'architettura: `core` per il calcolo, `cli` per il terminale (ADR-001).

## 2. File di configurazione

Sostituisci il `package.json` generato con questo, poi esegui di nuovo `npm install -D typescript @types/node` per riscrivere le versioni:

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

- `"type": "module"` usa gli `import` moderni.
- Gli **script** sono comandi con un nome: li lanci con `npm test` e `npm run typecheck`.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```

- `strict` attiva i controlli più severi sui tipi (roadmap › 1).
- `noEmit` dice a TypeScript di controllare soltanto, perché i file li esegue Node (ADR-005).
- `allowImportingTsExtensions` permette di scrivere `import … from './plates.ts'`.
- `erasableSyntaxOnly` ti segnala subito `enum` e le altre sintassi che il type stripping non supporta (ADR-005).
- `noUncheckedIndexedAccess` ti avvisa quando leggi un elemento di una lista che potrebbe non esserci, cosa utile con i dischi (best practice).

`.gitignore`:

```gitignore
node_modules/
```

## 3. Il test banale

Crea `test/setup.test.ts` con queste tre righe. Servono solo a verificare che tutto funzioni:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('il setup funziona', () => assert.equal(1 + 1, 2));
```

Poi lancia:

```sh
npm test
npm run typecheck
```

Il passo è fatto quando `npm test` mostra `pass 1` e `typecheck` non stampa errori. A quel punto puoi cancellare `setup.test.ts` e scrivere i primi test veri in `test/plates.test.ts`.
