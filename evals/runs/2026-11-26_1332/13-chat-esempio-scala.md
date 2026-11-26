## Esempio completo di `package.json`

Ecco un `package.json` completo che risolve sia lo script `test` sia la domanda sulle librerie.

**1. Installa le librerie che servono solo a te mentre sviluppi.** Una *dipendenza* è un pezzo di codice di altri che il tuo progetto usa. Qui ne servono due, e solo per controllare i tipi:

```sh
npm install -D typescript @types/node
```

Il flag `-D` le salva in `devDependencies`, cioè le librerie che servono a te mentre lavori e non a chi usa il programma. npm aggiunge la voce da solo: non serve scriverla a mano (`best practice`).

**2. Il file risultante:**

```json
{
  "name": "calcolo-1rm",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

Le righe meno ovvie:

- `"private": true` impedisce di pubblicare il progetto su npm per sbaglio (`best practice`).
- `"type": "module"` fa leggere i file con la sintassi moderna `import`/`export` (`best practice`).
- `node --test` avvia il test runner nativo di Node: è questa la correzione rispetto a `node test` (ADR-005). Il test runner è il programma che trova i tuoi test, li esegue e ti dice quali passano.
- `"test/**/*.test.ts"` dice al runner dove cercare: tutti i file che finiscono in `.test.ts` dentro `test/`, anche nelle sottocartelle. Le virgolette fanno espandere lo schema a Node e non al terminale.
- `tsc --noEmit` controlla che i tipi siano corretti senza generare file. Node infatti esegue il TypeScript ma non controlla i tipi (ADR-005).
- In `devDependencies` i numeri di versione saranno quelli che npm installa davvero. Il `^` permette aggiornamenti che non rompono nulla.

**3. Prova che funziona:**

1. Crea `test/prova.test.ts` con un test qualsiasi.
2. Lancia `npm test`: deve comparire `pass 1`.
3. Lancia `npm run typecheck`: non deve stampare niente, e questo vuol dire che è tutto a posto.

Per approfondire: nodejs.org/docs, sezione **Test runner** › "Running tests from the command line".
