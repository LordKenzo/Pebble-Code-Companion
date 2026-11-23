# Prossimo passo: 1 · Setup

Il motivo: prima di scrivere il calcolo dei dischi ti serve un progetto che controlla i tipi e fa girare i test. Così ogni riga che scrivi dopo la puoi verificare subito. (roadmap › passo 1)

## 1. Prepara la cartella

```sh
node --version                         # deve essere 22.18 o superiore (meglio 24)
npm init -y                            # crea package.json, che poi sostituisci
npm install -D typescript @types/node  # dipendenze solo di sviluppo
git init
mkdir -p src/core src/cli test
```

Una **dipendenza** è codice scritto da altri di cui il tuo progetto ha bisogno. `-D` vuol dire che serve solo mentre sviluppi, non quando il programma gira. Se `node --version` mostra una versione più vecchia, aggiorna Node prima di andare avanti: i test in `.ts` funzionano solo da 22.18 in su (ADR-005).

## 2. File di configurazione

Sostituisci il contenuto di `package.json`, ma **tieni le versioni** che npm ha scritto in `devDependencies`:

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
  "devDependencies": {}
}
```

- `type: module`: usi `import`/`export` moderni (buona pratica).
- `scripts`: comandi brevi che lanci con `npm run nome` (buona pratica).
- `typecheck`: TypeScript controlla i tipi senza produrre file. Node infatti si limita a cancellare i tipi e non li verifica (ADR-005).

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
    "noUncheckedIndexedAccess": true,
    "types": ["node"]
  },
  "include": ["src", "test"]
}
```

- `allowImportingTsExtensions`: ti permette di scrivere `import ... from "./plates.ts"`, come Node richiede.
- `erasableSyntaxOnly`: segnala `enum` e le altre sintassi che Node non sa cancellare (ADR-005).
- `noUncheckedIndexedAccess`: ti avvisa quando leggi da un array un elemento che potrebbe non esserci (buona pratica).

`.gitignore`:

```
node_modules/
```

## 3. Un test di prova

Crea `test/setup.test.ts`. Serve solo a vedere che il **test runner** (il programma che esegue i test) funziona. Lo cancellerai al passo 2.

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

test("il test runner funziona", () => {
  assert.equal(1 + 1, 2);
});
```

Poi lancia:

```sh
npm test
npm run typecheck
```

Il passo è fatto quando il primo comando mostra `pass 1` e il secondo non stampa niente.

**Domanda prima del passo 2:** come vuoi che `plates` restituisca i dischi per lato? Puoi usare una lista (`[25, 25, 10]`) oppure un conteggio per taglio (`25 → 2, 10 → 1`). La scelta cambia sia la firma della funzione sia il modo in cui scriverai i test.
