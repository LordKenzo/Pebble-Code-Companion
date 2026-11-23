Ecco il `package.json` completo, con lo script `test` corretto e le librerie per i test.

**1. Installa le librerie di sviluppo**

Una *dipendenza di sviluppo* è un pacchetto che ti serve mentre scrivi e controlli il codice, ma non quando il programma gira.

```sh
npm install -D typescript @types/node
```

- `typescript`: ti dà il comando `tsc`, che controlla i tipi (`ADR-005`).
- `@types/node`: descrive i tipi di Node (`node:test`, `node:assert`…), così `tsc` li riconosce.

npm aggiunge da solo queste voci in `devDependencies`, con le versioni che installa. Non scriverle a mano (`buona pratica`).

**2. Il file dopo l'installazione**

```json
{
  "name": "one-rep-max",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^5.9.0"
  }
}
```

- `"private": true`: impedisce di pubblicare il progetto su npm per sbaglio (`buona pratica`).
- `"type": "module"`: i tuoi file usano `import`/`export`. Node tratta così anche i `.ts` (`buona pratica`).
- `node --test`: avvia il test runner nativo. `node test` invece cercava di eseguire un programma chiamato `test` (`ADR-005`).
- `"test/**/*.test.ts"`: è un *glob*, cioè uno schema che vuol dire "tutti i file che finiscono in `.test.ts`, anche nelle sottocartelle di `test`". Le virgolette servono perché sia Node a leggerlo, non il terminale.
- `typecheck`: controlla i tipi senza produrre file. Node toglie i tipi ma non li verifica (`ADR-005`).
- Le versioni in `devDependencies` sono indicative: tieni quelle che scrive npm.

**3. Verifica**

1. Crea un file vuoto `test/smoke.test.ts`.
2. Lancia `npm test`. Deve partire il runner e dirti che ci sono 0 test, senza errori di file non trovato.
3. Lancia `npm run typecheck`. Per farlo funzionare serve un `tsconfig.json`: è il prossimo file da preparare, e te lo do completo quando ci arrivi.
