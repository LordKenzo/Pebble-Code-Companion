# Prossimo passo: 1 · Setup

**Perché ora:** non c'è ancora nessun passo completato (roadmap › 1). Prima di scrivere il calcolo dei dischi serve un progetto che si avvia, controlla i tipi e fa girare un test. Così, quando scriverai `plates`, saprai subito se un errore viene dal tuo codice o dalla configurazione.

## 1. Controlla Node e prepara la cartella

Node deve essere **22.18 o più recente**. Solo da quella versione esegue i file `.ts` direttamente: si chiama *type stripping*, cioè Node toglie le annotazioni di tipo e fa girare il resto (ADR-005).

```sh
node --version                 # deve stampare v22.18.0 o superiore (va bene anche v24)
git init                       # tiene la storia delle modifiche
mkdir -p src/core src/cli test # cartelle dall'architettura
```

## 2. File di configurazione

Crea questi tre file nella cartella del progetto.

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

- `"type": "module"` fa usare la sintassi moderna `import`/`export` (best practice).
- `scripts` contiene i comandi che lanci con `npm run nome`. Le virgolette nel glob fanno espandere il percorso a Node e non alla shell (best practice).
- `engines` dichiara la versione di Node minima (ADR-005).

`tsconfig.json`, le regole del controllo dei tipi:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "noUncheckedIndexedAccess": true,
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```

- `strict` attiva i controlli più severi (roadmap › 1).
- `noEmit` dice che TypeScript controlla e basta, perché a eseguire ci pensa Node (ADR-005).
- `allowImportingTsExtensions` ti permette di scrivere `import … from './plates.ts'`, come richiede Node.
- `erasableSyntaxOnly` segna come errore `enum` e simili, che il type stripping non supporta (ADR-005).
- `noUncheckedIndexedAccess` ti obbliga a gestire il caso «elemento mancante» quando leggi da una lista, utile per i dischi (best practice).

`.gitignore`, i file da non salvare nella storia:

```
node_modules/
```

Poi installa le **dipendenze di sviluppo**. Sono strumenti che ti servono mentre lavori ma non fanno parte del programma finito.

```sh
npm install -D typescript @types/node
```

`typescript` serve per `tsc` (il controllo dei tipi), `@types/node` serve per descrivere a TypeScript `node:test` e `node:assert`.

## 3. Il primo test

Crea `test/setup.test.ts`. Serve solo a dimostrare che il test runner funziona:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('setup: il runner funziona', () => assert.equal(1 + 1, 2));
```

Poi verifica:

```sh
npm test            # deve dire: pass 1, fail 0
npm run typecheck   # non deve stampare niente
```

Se entrambi vanno, il passo 1 è fatto. Puoi cancellare `setup.test.ts` appena avrai il primo test vero di `plates` (roadmap › Da dove partire).
