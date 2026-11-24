# Prossimo passo: 1 · Setup

**Perché adesso:** prima di scrivere il calcolo dei dischi serve un progetto che si avvia e un test che passa. Così ogni riga di logica che scriverai sarà verificata subito (bootstrap › Vincoli: "Voglio dei test").

## 1. Controlla Node e crea le cartelle

Ti serve Node 22.18 o più recente (consigliato il 24). Con queste versioni Node esegue i file `.ts` direttamente: questo si chiama *type stripping*, cioè Node toglie i tipi e fa girare il resto (ADR-005).

```sh
node --version
npm init -y
git init
mkdir -p src/core src/cli test
npm install -D typescript @types/node
```

- `npm init -y` crea `package.json`, il file che descrive il progetto.
- `git init` attiva il controllo di versione, cioè la storia delle modifiche (`buona pratica`).
- Le cartelle seguono l'architettura: `core` per il calcolo, `cli` per il terminale (ADR-001).
- `npm install -D` installa due *dipendenze di sviluppo*: strumenti che servono a te mentre lavori, non al programma quando gira. TypeScript serve solo a controllare i tipi (ADR-005).

## 2. Scrivi i file di configurazione

Sostituisci `package.json` con questo, lasciando le versioni che npm ha scritto in `devDependencies`:

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

- `"type": "module"` usa gli `import` moderni (`buona pratica`).
- `engines` dichiara la versione minima di Node richiesta dal type stripping (ADR-005).
- `scripts` sono scorciatoie: `npm test` lancia i test, `npm run typecheck` controlla i tipi (`buona pratica`).

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

- `strict`: TypeScript ti segnala più errori possibili. Per un calcolo pericoloso è quello che vuoi (roadmap › passo 1).
- `noEmit`: `tsc` controlla soltanto, non crea file. A eseguire ci pensa Node (ADR-005).
- `allowImportingTsExtensions`: ti permette di scrivere `import … from './plates.ts'`, come richiede Node.
- `erasableSyntaxOnly`: ti blocca se usi `enum` o altre cose che il type stripping non supporta (ADR-005).
- `noUncheckedIndexedAccess`: ti avvisa quando leggi una posizione di una lista che potrebbe non esistere. Ti sarà utile con la lista dei dischi (`buona pratica`).

`.gitignore`:

```
node_modules/
```

## 3. Un test che passa

Crea `test/setup.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('setup: i test girano', () => assert.equal(1 + 1, 2));
```

Poi lancia:

```sh
npm test
npm run typecheck
```

Hai finito il passo quando `npm test` mostra 1 test passato e `typecheck` non stampa errori.

**Prossima tappa:** i test di `plates` (roadmap › Da dove partire). Prima di aprire il file, prendi carta e penna. Scrivi quali dischi metteresti per lato per 60 kg e per 142,5 kg: quelli saranno i valori attesi dei tuoi primi test.
