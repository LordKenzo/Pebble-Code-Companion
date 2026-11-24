Il file è un buon inizio (bene `engines` allineato ad ADR-005), ma lo script `test` non lancia il test runner e mancano i pezzi del passo 1.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` non avvia `node:test`. Node prova a eseguire un file chiamato `test` (o `test/index.js`) come un normale script.  
> Perché: `npm test` fallisce, oppure passa senza aver girato nessun test. È un falso verde, pericoloso in un progetto dove un carico sbagliato finisce sul bilanciere.  
> Prova: `"test": "node --test"`. Il flag attiva il runner nativo, che cerca da solo i file `*.test.ts`.

> **[avviso] riga 2 · roadmap › passo 1, ADR-005**  
> Problema: manca lo script `typecheck` e TypeScript non è installato.  
> Perché: il type stripping elimina i tipi senza controllarli. Senza `tsc --noEmit` un errore di tipo (ad esempio grammi passati dove servono kg, ADR-003) non viene segnalato da nessuno. Il principio è fail fast: l'errore va scoperto prima dell'esecuzione.  
> Prova:
> ```sh
> npm install -D typescript @types/node
> ```
> poi aggiungi lo script `"typecheck": "tsc --noEmit"`.

> **[info] riga 1 · best practice**  
> Problema: mancano `name`, `private` e `type`.  
> Perché: senza `"type": "module"` Node deve indovinare se i file `.ts` sono ESM o CommonJS. `"private": true` evita una pubblicazione accidentale su npm.  
> Prova: usa il file completo qui sotto.

```json
{
  "name": "mini-calc",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0"
  }
}
```

- `type: module`: i file usano `import`/`export` in modo esplicito.
- `devDependencies`: le versioni le scrive `npm install -D`, quindi lascia quelle che ti genera il comando.

Il prossimo file è `tsconfig.json` in modalità strict. Ricordati di attivare `noEmit` e `allowImportingTsExtensions`, perché con il type stripping gli import usano l'estensione `.ts`.
