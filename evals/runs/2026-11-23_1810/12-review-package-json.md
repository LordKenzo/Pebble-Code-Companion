Il file è un buon inizio (`engines` è già allineato ad ADR-005), ma lo script `test` non lancia il test runner e manca il controllo dei tipi.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` esegue un file chiamato `test` (o `test/index.js`), non il test runner. Se quel file non c'è, il comando fallisce. Se c'è, i test in `*.test.ts` non vengono mai raccolti.  
> Perché: ADR-005 sceglie `node:test`, che si attiva solo con il flag `--test`. Un comando di test che non trova i test sembra "verde" e non protegge niente: qui un carico sbagliato finisce sul bilanciere.  
> Prova: `"test": "node --test \"src/**/*.test.ts\""`. Le virgolette lasciano espandere il glob a Node invece che alla shell, così funziona uguale su ogni sistema.

> **[avviso] scripts · ADR-005, roadmap › passo 1**  
> Problema: manca lo script `typecheck` e mancano `typescript` e `@types/node` tra le dipendenze di sviluppo.  
> Perché: il type stripping cancella i tipi senza controllarli. Senza `tsc --noEmit` un errore di tipo, ad esempio grammi passati dove servono kg (ADR-003), arriva a runtime senza che nessuno se ne accorga. Il principio è il *fail fast*: l'errore deve emergere il prima possibile.  
> Prova: `npm install -D typescript @types/node` e aggiungi `"typecheck": "tsc --noEmit"`.

> **[info] radice · buona pratica**  
> Problema: mancano `"type": "module"`, `"private": true` e `name`.  
> Perché: senza `type` Node deve indovinare se i file `.ts` sono ESM o CommonJS. Con `private` eviti di pubblicare il pacchetto su npm per sbaglio.  
> Prova: usa la versione completa qui sotto.

```sh
npm install -D typescript @types/node
```

```json
{
  "name": "mini-calc",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "test": "node --test \"src/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

- `"type": "module"`: i file sono ES module, quindi usano `import`/`export`.
- `"private": true`: `npm publish` viene rifiutato.
- `devDependencies`: la aggiunge `npm install -D` con le versioni corrette, non serve scriverla a mano.

Il percorso del glob presuppone i test accanto ai sorgenti in `src/` (es. `src/core/plates.test.ts`). Se li metti in una cartella `test/`, cambia solo quel percorso.

Prossimo file del passo 1: `tsconfig.json`. Con il type stripping gli import devono includere l'estensione `.ts`, quindi servono `allowImportingTsExtensions` e `erasableSyntaxOnly`.
