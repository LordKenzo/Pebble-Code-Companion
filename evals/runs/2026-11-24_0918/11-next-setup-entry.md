# Prossimo passo: 1 · Setup

**Perché adesso:** prima di scrivere `plates` serve un progetto che compila e un test che passa. Così, quando un test diventa rosso, sai che il problema è nella logica e non negli strumenti (`roadmap › 1`).

## 1. Prepara la cartella e gli strumenti

Controlla la versione di Node. Il type stripping (Node esegue i file `.ts` togliendo i tipi) richiede la 22.18 o superiore (ADR-005).

```sh
node -v
git init
mkdir -p src/core src/cli test
```

`git init` attiva il controllo di versione, cioè la cronologia delle modifiche (`best practice`). Le cartelle seguono l'architettura: `core` per il calcolo, `cli` per il terminale (ADR-001).

## 2. Scrivi i file di configurazione

`package.json` è la carta d'identità del progetto: nome, script e dipendenze. Una dipendenza è codice scritto da altri che il tuo usa.

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

- `"type": "module"`: usa la sintassi moderna `import`/`export`.
- `"private": true`: evita di pubblicare il progetto per sbaglio su npm.
- `test`: lancia `node:test` su tutti i file `*.test.ts` dentro `test/` (ADR-005).
- `typecheck`: controlla i tipi senza produrre file (ADR-005).

Poi installa gli strumenti di sviluppo. Sono dipendenze che servono solo a te mentre lavori, non al programma finito:

```sh
npm install -D typescript @types/node
```

`tsconfig.json` dice a TypeScript quanto essere severo:

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
    "types": ["node"]
  },
  "include": ["src", "test"]
}
```

- `strict`: il controllo più severo. Trova errori prima che arrivino in palestra (`roadmap › 1`).
- `noUncheckedIndexedAccess`: ti obbliga a gestire il caso «elemento mancante» quando leggi da una lista (`best practice`).
- `allowImportingTsExtensions`: permette di scrivere `import … from './plates.ts'`, come richiede il type stripping (ADR-005).
- `erasableSyntaxOnly`: segnala `enum` e parameter properties, che il type stripping non sa eseguire (ADR-005).

`.gitignore` elenca i file che git deve ignorare:

```
node_modules/
```

## 3. Un test banale che passa

Crea `test/setup.test.ts`:

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

Il passo è fatto quando entrambi i comandi finiscono senza errori. Fai un primo commit, poi passiamo ai test di `plates`.
