# Prossimo passo: 1 · Setup

Prima di scrivere la logica serve un progetto che si avvia, controlla i tipi e lancia un test. Così, quando scriverai `plates`, potrai verificarlo subito. Tutto quello che segue è configurazione: lo trovi completo e puoi copiarlo così com'è.

## 1. Controlla Node e crea il progetto

ADR-005 usa il *type stripping*: Node esegue direttamente i file `.ts` togliendo i tipi, senza un passaggio di compilazione. Per farlo serve Node 22.18 o più recente.

```sh
node --version        # deve dire v22.18 o più, oppure v24.x
git init              # inizia a tenere la storia delle modifiche
npm init -y           # crea package.json
npm install -D typescript @types/node
```

Una *dipendenza* è codice scritto da altri che serve al tuo progetto. `-D` vuol dire "serve solo mentre sviluppi". `typescript` controlla i tipi, `@types/node` gli spiega com'è fatto Node.

Sostituisci il contenuto di `package.json` con questo, lasciando le versioni che npm ha scritto in `devDependencies`:

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

- `private`: impedisce di pubblicarlo su npm per sbaglio (`buona pratica`).
- `type: module`: usa la sintassi moderna `import`/`export` (`buona pratica`).
- `engines`: dichiara la versione minima di Node (ADR-005).
- `scripts`: comandi brevi da lanciare con `npm run …`. Le virgolette attorno al percorso servono perché sia Node a cercare i file, non la shell (`buona pratica`).

## 2. tsconfig, .gitignore e cartelle

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
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```

- `strict`: il controllo dei tipi più severo (roadmap › passo 1).
- `noEmit`: TypeScript controlla soltanto e non produce file `.js`, perché a eseguire ci pensa Node (ADR-005).
- `allowImportingTsExtensions`: negli import scriverai `./plates.ts` con l'estensione, come richiede Node.
- `erasableSyntaxOnly`: segnala come errore `enum` e altre forme che il type stripping non supporta (ADR-005).
- `noUncheckedIndexedAccess`: ti obbliga a gestire il caso in cui `lista[i]` non esista. Utile qui, perché leggerai gli argomenti da una lista (`buona pratica`).

`.gitignore`:

```
node_modules/
```

```sh
mkdir -p src/core src/cli test
```

## 3. Un test banale che passa

Crea `test/setup.test.ts` con queste 3 righe:

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

Il passo è fatto quando entrambi i comandi finiscono senza errori. A quel punto fai il primo commit:

```sh
git add -A && git commit -m "setup"
```

Al passo 2 il test di setup lo cancelli e scrivi i test di `plates` partendo dai casi indicati nella roadmap.
