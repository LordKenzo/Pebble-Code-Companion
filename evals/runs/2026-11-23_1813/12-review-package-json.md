Il file è un inizio, ma lo script `test` non lancia il test runner, e mancano alcune voci del passo 1 della roadmap.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` non avvia `node:test`. Prova a eseguire come programma un file o una cartella chiamata `test`.  
> Perché: i test potrebbero non girare affatto, oppure fallire per il motivo sbagliato. In un progetto dove un carico sbagliato è pericoloso, un comando di test inaffidabile toglie la rete di sicurezza.  
> Prova: `"test": "node --test \"src/**/*.test.ts\""`. Le virgolette fanno espandere il glob a Node e non alla shell.

> **[info] righe 2-4 · roadmap › passo 1, ADR-005**  
> Problema: mancano lo script `typecheck` e la dipendenza `typescript`.  
> Perché: il type stripping cancella i tipi senza controllarli. Senza `tsc --noEmit` un errore di tipo passa inosservato. È la **separazione delle responsabilità**: Node esegue il codice, `tsc` verifica i tipi.  
> Prova: `npm install -D typescript @types/node`, poi `"typecheck": "tsc --noEmit"`.

> **[avviso] riga 1 · buona pratica**  
> Problema: mancano `"type": "module"`, `"name"` e `"private": true`.  
> Perché: senza `type` Node deve indovinare se i tuoi `.ts` usano `import` o `require`, e può mostrarti avvisi o reinterpretare i file. Con `private` eviti di pubblicare il progetto su npm per sbaglio.  
> Prova: aggiungi le tre voci, come nel file completo qui sotto.

```json
{
  "name": "mini-calc",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": { "mini-calc": "./src/cli/main.ts" },
  "scripts": {
    "test": "node --test \"src/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" },
  "devDependencies": {
    "typescript": "^5.9.0",
    "@types/node": "^22.18.0"
  }
}
```

- `bin`: rende disponibile il comando `mini-calc` dopo `npm link`. Il percorso è una proposta coerente con ADR-001 (`cli` separata da `core`) e puoi aggiornarlo quando crei il file.
- `@types/node`: dà a `tsc` i tipi di `node:test`, `node:assert` e `process`.
- Le versioni in `devDependencies` si allineano da sole quando lanci il comando `npm install -D`.

Hai già scelto dove mettere i test, accanto ai file (`src/core/plates.test.ts`) o in una cartella `test/` separata? Il glob dello script dipende da questa scelta.
