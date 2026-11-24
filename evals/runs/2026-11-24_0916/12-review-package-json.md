Il file è un buon inizio, ma lo script `test` non lancia i test e manca il controllo dei tipi previsto dal passo 1.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` esegue un file chiamato `test` (o `test/index.js`), non il test runner.  
> Perché: ADR-005 sceglie `node:test`, che parte solo con il flag `--test`. Così `npm test` fallisce, oppure passa senza aver eseguito nessun test. È il principio del *fail loudly*: un test che non gira è peggio di un test rosso.  
> Prova: `"test": "node --test \"src/**/*.test.ts\""`. Il glob esplicito fa trovare a Node i file `.ts` senza ambiguità.

> **[avviso] riga 2 · ADR-005, roadmap › passo 1**  
> Problema: mancano lo script `typecheck` e la dipendenza `typescript`.  
> Perché: il type stripping cancella i tipi senza controllarli. Secondo ADR-005 l'unico controllo è `tsc --noEmit`, quindi senza di esso un errore di tipo sui grammi arriva fino al bilanciere.  
> Prova: `npm install -D typescript @types/node`, poi aggiungi lo script `"typecheck": "tsc --noEmit"`.

> **[info] riga 1 · best practice**  
> Problema: mancano `"type": "module"` e `"private": true`.  
> Perché: senza `type`, Node deve indovinare se i `.ts` usano `import` o `require`. Con `private` eviti di pubblicare il progetto su npm per sbaglio.  
> Prova: usa il file completo qui sotto.

```json
{
  "name": "mini-calc",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"src/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" },
  "devDependencies": {
    "@types/node": "^22.18.0",
    "typescript": "^5.9.0"
  }
}
```

- `"type": "module"`: i `.ts` e i `.js` sono moduli ES, cioè usano `import`/`export`.
- `@types/node`: dà i tipi di `node:test`, `node:assert` e `process` a `tsc`.
- Le versioni nei `devDependencies` le scrive `npm install -D`. Tieni quelle che ti genera.

Domanda: i test li metti accanto al codice (`src/core/plates.test.ts`) o in una cartella `test/` separata? Il glob dello script dipende da questa scelta.
