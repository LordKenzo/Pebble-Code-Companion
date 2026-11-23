Il file è il punto di partenza giusto (`engines` è coerente con ADR-005), ma lo script `test` non lancia il test runner e mancano alcune voci del passo 1 della roadmap.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` non avvia `node:test`. Node prova a eseguire un file o una cartella chiamata `test` come se fosse un programma qualunque.  
> Perché: i test non partono, oppure partono solo in parte senza che te ne accorga. Così un carico sbagliato passa inosservato, che è proprio il rischio del bootstrap.  
> Prova: usa `"test": "node --test \"src/**/*.test.ts\""`. Il flag `--test` attiva il runner e le virgolette fanno espandere il glob a Node, non alla shell.

> **[avviso] riga 2 · roadmap › passo 1**  
> Problema: manca lo script `typecheck` e non c'è `typescript` tra le dipendenze di sviluppo.  
> Perché: il type stripping toglie i tipi senza controllarli. Senza `tsc --noEmit` un errore di tipo arriva fino all'esecuzione. È il principio del *fail fast*: un errore scoperto presto costa meno.  
> Prova: esegui `npm install -D typescript @types/node`, poi aggiungi lo script e il `tsconfig.json` qui sotto.

> **[info] riga 1 · buona pratica**  
> Problema: mancano `name`, `private` e `"type": "module"`.  
> Perché: senza `type`, Node deve indovinare il formato di ogni file `.ts` e stampa un avviso a ogni esecuzione. `private: true` evita di pubblicare il progetto su npm per sbaglio.  
> Prova: aggiungi le tre voci, come nel file qui sotto.

`package.json` completo:

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
    "@types/node": "^22.0.0",
    "typescript": "^5.9.0"
  }
}
```

Le versioni le scrive `npm install`. Lascia quelle che ti genera.

`tsconfig.json`, che serve perché `tsc --noEmit` sappia cosa controllare:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Le voci meno ovvie:

- `module: nodenext` fa risolvere gli import come li risolve Node.
- `allowImportingTsExtensions` permette di scrivere `import … from "./plates.ts"`, che con il type stripping è obbligatorio.
- `verbatimModuleSyntax` ti obbliga a usare `import type` per i soli tipi, che Node deve poter cancellare.
- `erasableSyntaxOnly` fa segnalare a `tsc` gli `enum` e le parameter properties, cioè proprio quello che ADR-005 vieta.

Per verificare il passo 1, crea un `src/smoke.test.ts` con un'asserzione banale, poi lancia `npm test` e `npm run typecheck`. Devono passare tutti e due.
