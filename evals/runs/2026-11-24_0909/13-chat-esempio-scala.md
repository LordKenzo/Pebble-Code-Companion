Ecco il `package.json` completo, con lo script di test corretto e le librerie già al loro posto.

**1. Installa le librerie dal terminale**, nella cartella del progetto:

```sh
npm install -D typescript @types/node
```

`-D` significa "dipendenza di sviluppo": una libreria che ti serve mentre scrivi e controlli il codice, ma non quando il programma gira. npm la scarica nella cartella `node_modules` e la aggiunge da solo al `package.json`, insieme al numero di versione.

**2. Il file dopo l'installazione** dovrebbe somigliare a questo (i numeri di versione possono essere diversi, va bene così):

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
    "@types/node": "^22.18.0",
    "typescript": "^5.9.0"
  }
}
```

Le voci meno ovvie:

- `"private": true`: impedisce di pubblicare il progetto su npm per sbaglio (`buona pratica`).
- `"type": "module"`: fa leggere a Node i tuoi file con la sintassi moderna `import`/`export` (`buona pratica`).
- `"test"`: `--test` avvia il test runner nativo (lo strumento che trova ed esegue i test), invece di lanciare `test` come se fosse un programma. Il percorso tra virgolette dice quali file cercare: tutti quelli che finiscono in `.test.ts` dentro `test/` (`ADR-005`).
- `"typecheck"`: `tsc --noEmit` controlla che i tipi siano giusti senza generare file. Node infatti toglie i tipi e non li verifica (`ADR-005`).
- `devDependencies`: `typescript` fornisce il comando `tsc`, `@types/node` gli spiega com'è fatto Node (per esempio `node:test`). Per i test non serve nessun'altra libreria (`ADR-005`).

**3. Verifica che funzioni:**

```sh
npm test
npm run typecheck
```

Se `npm test` risponde "0 test", va bene: il runner parte correttamente, devi solo ancora creare il primo file in `test/`. La scelta dei file è giusta: tenere i test in una cartella separata rispetta la divisione tra core e CLI decisa in `ADR-001`.
