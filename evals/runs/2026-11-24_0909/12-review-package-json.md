Il `package.json` è un buon inizio (`engines` è allineato ad ADR-005), ma oggi `npm test` non esegue nessun test.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` non avvia il test runner. Node prova a eseguire un file o una cartella chiamata `test` come se fosse un programma.  
> Perché: ADR-005 sceglie `node:test`, che si attiva solo con il flag `--test`. Senza il flag i test non girano, e un test che non gira non protegge nessun carico sul bilanciere.  
> Prova: `"test": "node --test \"src/**/*.test.ts\""`. Le virgolette fanno espandere il pattern a Node invece che alla shell, così funziona su tutti i sistemi.

> **[avviso] scripts · roadmap › passo 1, ADR-005**  
> Problema: manca lo script `typecheck` e manca TypeScript tra le dipendenze di sviluppo.  
> Perché: il type stripping cancella i tipi senza controllarli. Un errore di tipo, per esempio kg passati dove servono grammi (ADR-003), passerebbe inosservato. Il controllo dei tipi lo fa `tsc --noEmit`.  
> Prova: `npm install -D typescript @types/node`, poi aggiungi `"typecheck": "tsc --noEmit"`.

> **[info] radice · buona pratica**  
> Problema: mancano `name`, `private` e `type`.  
> Perché: `"private": true` impedisce di pubblicare il pacchetto su npm per sbaglio. `"type": "module"` dice a Node di trattare i file come moduli ES (il sistema di `import`/`export`), coerente con gli import `.ts` del type stripping.  
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
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0"
  }
}
```

Le versioni in `devDependencies` le scrive `npm install -D` da solo: tieni quelle che ti genera.

Il prossimo file è `tsconfig.json`, che è ancora parte del passo 1. Per il type stripping servono `"noEmit": true`, `"allowImportingTsExtensions": true` ed `"erasableSyntaxOnly": true`. L'ultima opzione segnala `enum` e parameter properties, che ADR-005 vieta.
