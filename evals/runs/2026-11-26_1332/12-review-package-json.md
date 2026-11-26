Il file c'è, ma oggi `npm test` non esegue nessun test e manca il controllo dei tipi previsto dal passo 1.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` non avvia il test runner. Node prova a eseguire un file chiamato `test` (o `test/index.js`) come un normale script, quindi i tuoi `.test.ts` non partono.  
> Perché: con un carico sbagliato il rischio è fisico. Se i test non girano davvero, `npm test` ti dà una falsa sicurezza.  
> Prova: usa il flag `--test` con un glob esplicito: `"test": "node --test \"test/**/*.test.ts\""`. Le virgolette fanno passare il glob a Node invece che alla shell.

> **[avviso] riga 2 · ADR-005, roadmap › passo 1**  
> Problema: manca lo script `typecheck` e TypeScript non è installato.  
> Perché: il type stripping di Node toglie i tipi senza verificarli. Senza `tsc --noEmit` un errore di tipo, per esempio kg passati dove servono grammi (ADR-003), arriva fino all'esecuzione.  
> Prova: `npm install -D typescript @types/node` e aggiungi `"typecheck": "tsc --noEmit"`. Il principio è avere un controllo statico separato dall'esecuzione.

> **[info] riga 1 · best practice**  
> Problema: mancano `name`, `private` e `"type": "module"`.  
> Perché: senza `"type"` Node deve indovinare se i tuoi `.ts` sono ESM o CommonJS. `private: true` evita di pubblicare il pacchetto su npm per errore.  
> Prova: usa il file completo qui sotto.

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
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" }
}
```

- `"type": "module"`: tutti i `.ts`/`.js` sono ES module (`import`/`export`).
- `node --test "…"`: avvia `node:test` sui file che corrispondono al glob. I test stanno in `test/`, separati da `src/core` e `src/cli` (ADR-001).
- `devDependencies` lo compila `npm install -D` da solo, non serve scriverlo a mano.

Per approfondire: nodejs.org/docs › Test runner › «Running tests from the command line».

Domanda: vuoi che ti prepari anche il `tsconfig.json`? Lo imposterei strict e con `erasableSyntaxOnly`, così `tsc` ti blocca gli `enum` vietati da ADR-005.
