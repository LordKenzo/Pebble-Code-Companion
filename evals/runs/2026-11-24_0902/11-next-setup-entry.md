# Prossimo passo: 1 · Setup

**Perché adesso:** prima di scrivere qualsiasi calcolo serve un progetto che si avvia e un comando che esegue i test. Così, quando scriverai `plates`, saprai subito se un carico è giusto o sbagliato (`bootstrap › Vincoli`: "voglio dei test").

## 1. Prepara la cartella e lo strumento

Controlla la versione di Node: deve essere **22.18 o più recente**. Solo da quella versione Node esegue i file `.ts` senza un passaggio di compilazione (ADR-005).

```sh
node --version
git init
npm init -y
npm install -D typescript @types/node
mkdir -p src/core src/cli test
```

- `git init` tiene la storia delle modifiche, così puoi tornare indietro se rompi qualcosa (`buona pratica`).
- Una **dipendenza di sviluppo** (`-D`) è un pezzo di codice che ti serve mentre lavori ma non quando il programma gira. Qui servono TypeScript, per controllare i tipi, e le definizioni dei tipi di Node.
- Le cartelle seguono `architecture › Livelli e cartelle`.

## 2. Sostituisci i file di configurazione

`package.json`, con questo contenuto completo. Le versioni le ha già scritte npm: se sono diverse dalle tue, tieni le tue.

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
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.8.0"
  }
}
```

- `"type": "module"` fa usare a Node la sintassi `import`/`export`.
- `"private": true` impedisce di pubblicare il progetto su npm per sbaglio.
- Gli **script** sono comandi con un nome breve: li lanci con `npm test` e `npm run typecheck`.
- Le virgolette intorno al percorso dei test servono perché il percorso lo legga Node e non la shell zsh.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
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

- `strict` attiva tutti i controlli più severi (roadmap › passo 1).
- `noUncheckedIndexedAccess` ti avvisa quando leggi da una lista un elemento che potrebbe non esistere. Ti sarà utile con la lista dei dischi (`buona pratica`).
- `noEmit` dice che TypeScript controlla soltanto e non produce file: a eseguire ci pensa Node (ADR-005).
- `allowImportingTsExtensions` ti permette di scrivere `import … from './plates.ts'` con l'estensione, come richiede Node.
- `erasableSyntaxOnly` segnala come errore `enum` e le altre forme che Node non sa eseguire (ADR-005).

`.gitignore`:

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

Poi lancia i due controlli:

```sh
npm test
npm run typecheck
```

**Fatto quando:** `npm test` mostra `pass 1` e `typecheck` non stampa nessun errore. A quel punto cancella il test banale e passa ai test di `plates` (roadmap › Da dove partire).

**Domanda da porti prima del passo 2:** se `plates` lavora in grammi interi (ADR-003), quanti grammi vale un disco da 1,25 kg, e come scriveresti la lista dei dischi in quell'unità?
