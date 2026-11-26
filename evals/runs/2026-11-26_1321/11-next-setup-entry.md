# Prossimo passo: il setup (passo 1 della roadmap)

**Perché ora:** prima di scrivere `plates` serve un progetto che compili e un comando che faccia girare i test. Così ogni riga di calcolo che scriverai potrà essere verificata subito. Per questo progetto i test contano molto: un carico sbagliato finisce sul bilanciere (`bootstrap › Vincoli`).

## 1. Controlla Node e crea il progetto

Apri il terminale nella cartella `mini-calc` e lancia questi comandi in ordine:

```sh
node --version          # deve dire v22.18 o più, oppure v24 (ADR-005)
git init                # storico delle modifiche (best practice)
npm init -y             # crea package.json
npm install -D typescript @types/node
mkdir -p src/core src/cli test
```

Due termini:
- **Dipendenza**: un pezzo di codice scritto da altri che il tuo progetto usa.
- **`-D`**: la installa come "dipendenza di sviluppo". Serve a te mentre programmi, non al programma finito.

Se la versione di Node è più vecchia, installa la 24 LTS da nodejs.org prima di andare avanti.

## 2. Scrivi i file di configurazione

Sostituisci il contenuto di `package.json` con questo:

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
    "typescript": "^5.9.0",
    "@types/node": "^24.0.0"
  }
}
```

Le voci meno ovvie:
- `"type": "module"`: usa la sintassi moderna `import`/`export` (best practice).
- `engines`: dichiara la versione minima di Node richiesta (ADR-005).
- `scripts`: comandi brevi da lanciare con `npm test` e `npm run typecheck` (best practice).
- `test`: Node trova ed esegue i file che finiscono in `.test.ts` (ADR-005).
- `typecheck`: TypeScript controlla i tipi senza produrre file. Node infatti esegue il `.ts` ma non lo controlla (ADR-005).

Le versioni sotto `devDependencies` lasciale come le ha scritte `npm install`.

Crea `tsconfig.json`:

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

Le voci meno ovvie:
- `strict`: TypeScript ti segnala più errori possibili (roadmap › passo 1).
- `noUncheckedIndexedAccess`: ti obbliga a gestire "elemento non trovato" quando leggi da una lista (best practice). È utile quando scorrerai la lista dei dischi.
- `allowImportingTsExtensions`: ti permette di scrivere `import … from './plates.ts'`, come vuole Node.
- `erasableSyntaxOnly`: segnala `enum` e altre costruzioni che Node non sa eseguire (ADR-005).

Crea `.gitignore`:

```
node_modules/
```

## 3. Un test banale, per vedere che tutto gira

Crea `test/setup.test.ts` con queste tre righe:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('il setup funziona', () => assert.equal(1 + 1, 2));
```

Poi lancia `npm test` e `npm run typecheck`. Il passo è fatto quando il primo dice `pass 1` e il secondo non stampa errori.

Per approfondire, apri nodejs.org/docs, cerca la pagina "Test runner" e guarda come si scrive un `test` e come si usa `assert.equal`.

Subito dopo comincia il passo 2, `plates`. I dischi sono illimitati per taglio, come già deciso in ADR-004.
