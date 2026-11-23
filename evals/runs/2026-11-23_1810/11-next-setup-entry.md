# Passo 1 · Setup

**Perché adesso:** prima di scrivere `plates` ti serve un progetto dove puoi lanciare un test con un comando. Quando vedi un test passare, sai che gli strumenti funzionano e puoi pensare solo alla logica (roadmap › 1).

## 1. Controlla Node e prepara la cartella

Il type stripping è la funzione di Node che esegue i file `.ts` senza compilarli prima. Serve Node 22.18 o più recente (ADR-005). Se `node -v` mostra una versione più vecchia, installa la 24 LTS da nodejs.org.

```sh
node -v
git init
mkdir -p src/core src/cli test
```

## 2. Crea i file di configurazione

Crea `package.json` a mano: è il file che descrive il progetto e i comandi disponibili.

```json
{
  "name": "mini-calc",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18" },
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit",
    "check": "npm run typecheck && npm test"
  }
}
```

- `private`: evita di pubblicare il progetto su npm per sbaglio (buona pratica).
- `type: module`: usa la sintassi moderna `import`/`export` (buona pratica).
- `scripts`: sono i comandi che lanci con `npm run …`. `test` fa partire `node:test` (ADR-005). `typecheck` controlla i tipi senza produrre file.

Poi installa le dipendenze. Una dipendenza è un pezzo di codice di cui il tuo ha bisogno. Con `-D` le installi solo per lo sviluppo, non servono a chi usa il programma.

```sh
npm install -D typescript @types/node
```

Crea `tsconfig.json`, le regole che TypeScript usa per controllare il codice:

```json
{
  "compilerOptions": {
    "target": "esnext",
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

- `strict`: attiva tutti i controlli più severi. È quello che chiede la roadmap e ti protegge da molti errori.
- `allowImportingTsExtensions`: ti permette di scrivere `import … from "./plates.ts"`, cioè come Node vuole i file.
- `erasableSyntaxOnly`: dà errore se usi `enum` e altre sintassi che il type stripping non supporta (ADR-005).
- `noUncheckedIndexedAccess`: ti obbliga a gestire il caso in cui un elemento di una lista manca. È utile quando lavorerai sulla lista dei dischi (buona pratica).

Crea `.gitignore`, l'elenco dei file che git non deve salvare:

```gitignore
node_modules/
coverage/
*.log
.DS_Store
```

## 3. Verifica con un test banale

Crea `test/setup.test.ts`. Serve solo a controllare che il runner funzioni, poi lo puoi cancellare:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
test("il runner funziona", () => assert.equal(1 + 1, 2));
```

Poi lancia i controlli e salva il primo commit:

```sh
npm run check
git add . && git commit -m "Setup progetto"
```

Il passo è fatto quando `npm run check` finisce senza errori e mostra `pass 1`.

Il prossimo è il passo 2: scrivere `src/core/plates.ts` partendo dai suoi test.
