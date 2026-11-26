Ecco l'esempio sul tuo progetto. Una **dipendenza** è una libreria che serve al progetto per funzionare o per essere sviluppato.

**1. Installa le librerie** dal terminale, nella cartella del progetto:

```sh
npm install -D typescript @types/node
```

`-D` le registra in `devDependencies`, cioè tra gli strumenti che servono solo mentre sviluppi. npm aggiorna `package.json` da solo.

**2. Il `package.json` risultante** (i numeri di versione sono indicativi: tieni quelli scritti da npm):

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" },
  "devDependencies": {
    "@types/node": "^22.18.0",
    "typescript": "^6.0.0"
  }
}
```

- `private`: impedisce di pubblicare il progetto per sbaglio (best practice).
- `type: "module"`: usi `import` ed `export` per collegare i file (best practice).
- `test`: `--test` avvia il test runner, il programma di Node che esegue i test, sui file in `test` che finiscono in `.test.ts` (ADR-005).
- `typecheck`: controlla i tipi senza generare file (ADR-005).
- `engines`: la versione minima di Node (ADR-005).
- `@types/node`: descrive a TypeScript le funzioni di Node.
- `typescript`: fornisce il comando `tsc`.

Non c'è `dependencies`, la sezione per le librerie usate mentre il programma gira: per i test non te ne servono (ADR-005).

**3. Crea `tsconfig.json`**, il file di impostazioni di TypeScript, accanto a `package.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "nodenext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "types": ["node"]
  }
}
```

- `target` e `module`: JavaScript moderno, con le regole di Node.
- `strict`: attiva i controlli più severi.
- `noEmit`: non genera file JavaScript.
- `allowImportingTsExtensions`: permette di importare file scrivendo `.ts`.
- `erasableSyntaxOnly`: segnala ciò che Node non sa eseguire, come `enum` (ADR-005).
- `verbatimModuleSyntax`: ti obbliga a distinguere gli import di soli tipi (`import type`).
- `types`: carica i tipi di Node.

**4. Prova** con `npm test` e `npm run typecheck`. Hanno bisogno di almeno un file `.ts`, per esempio il tuo primo test in `test/`.
