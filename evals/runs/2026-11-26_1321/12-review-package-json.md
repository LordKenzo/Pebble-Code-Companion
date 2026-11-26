Il `package.json` è un buon inizio, ma lo script `test` non lancia il test runner e manca il resto del passo 1 della roadmap.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` esegue un file chiamato `test` come se fosse un programma. Non avvia `node:test`.  
> Perché: i test resterebbero ignorati, oppure lo script fallirebbe con "Cannot find module". In un progetto dove un carico sbagliato è pericoloso, un test che non gira è peggio di nessun test, perché dà falsa sicurezza.  
> Prova: `"test": "node --test \"src/**/*.test.ts\""`. Il flag `--test` attiva il runner nativo, e il glob tra virgolette lo fa espandere a Node, non alla shell.

> **[avviso] package.json · roadmap › passo 1, ADR-005**  
> Problema: mancano lo script `typecheck` e la dipendenza `typescript`.  
> Perché: il type stripping toglie i tipi senza controllarli. Senza `tsc --noEmit` un errore di tipo, per esempio kg passati dove servono grammi (ADR-003), arriva fino all'esecuzione. È il principio del *fail fast*: un errore conviene scoprirlo il prima possibile.  
> Prova: `npm install -D typescript @types/node`, poi aggiungi `"typecheck": "tsc --noEmit"`. Il `tsconfig.json` strict è il passo successivo.

> **[info] package.json · best practice**  
> Problema: mancano `"type": "module"`, `"name"` e `"private": true`.  
> Perché: senza `"type"` Node deve indovinare se i file `.ts` sono ESM o CommonJS. `"private": true` impedisce di pubblicare il pacchetto su npm per sbaglio.  
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
  "devDependencies": {}
}
```

`devDependencies` si riempie da solo quando lanci `npm install -D typescript @types/node`. `@types/node` serve a `tsc` per conoscere i tipi di `node:test` e `node:assert`.

Per approfondire: nella documentazione ufficiale di Node (nodejs.org/docs), cerca la pagina *Test runner* e la sezione *Running tests from the command line*.
