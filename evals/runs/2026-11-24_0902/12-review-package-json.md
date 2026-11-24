Il file è un buon inizio (`engines` allineato ad ADR-005), ma lo script `test` così non lancia il test runner e mancano alcuni pezzi del passo 1.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` non avvia `node:test`. Prova a eseguire un file chiamato `test`, quindi fallisce subito o non trova nulla.  
> Perché: ADR-005 sceglie il runner nativo, che si attiva solo con il flag `--test`. Senza test che girano, il vincolo "voglio dei test" del bootstrap resta scoperto.  
> Prova: `"test": "node --test \"src/**/*.test.ts\""`. Le virgolette fanno espandere il glob a Node e non alla shell, così funziona uguale su ogni sistema.

> **[avviso] riga 1 · buona pratica**  
> Problema: manca `"type": "module"`.  
> Perché: senza questa voce Node deve indovinare se i tuoi `.ts` sono CommonJS o ESM. Con gli `import` può dare avvisi o comportamenti diversi tra file. Dichiararlo rende esplicito il formato dei moduli.  
> Prova: aggiungi `"type": "module"` (vedi file completo sotto).

> **[info] riga 2 · bootstrap › Vincoli + roadmap passo 1**  
> Problema: mancano lo script `typecheck` e la dipendenza `typescript`.  
> Perché: il type stripping di Node rimuove i tipi senza controllarli. ADR-005 affida quel controllo a `tsc --noEmit`. È il principio "fallisci presto": un errore di tipo lo scopri prima di arrivare in palestra.  
> Prova: installa le dipendenze e usa il file completo qui sotto.

```sh
npm install -D typescript @types/node
```

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
  "engines": { "node": ">=22.18.0" }
}
```

- `private: true` evita di pubblicare per sbaglio il pacchetto su npm.
- Le `devDependencies` le aggiunge da sola l'installazione con `-D`.
- `src/` è la cartella in cui staranno `core` e `cli` (ADR-001).

Il prossimo file da preparare è `tsconfig.json`. Servono `strict`, `noEmit` e `allowImportingTsExtensions`, perché con il type stripping gli import includono `.ts`.
