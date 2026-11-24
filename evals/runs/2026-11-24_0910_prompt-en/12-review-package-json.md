**Riassunto:** il manifest è appena abbozzato e lo script `test` oggi non avvia il test runner.

> **[errore] riga 3 · ADR-005**  
> Problema: `node test` non lancia `node:test`. Esegue un file chiamato `test` (`test.js` o `test/index.js`), che non esiste.  
> Perché: i test sono la tua rete di sicurezza sui carichi (bootstrap › Vincoli). Uno script che fallisce sempre, o che non trova nulla, è peggio di nessuno script.  
> Prova: usa il flag `--test` con un glob tra virgolette, così è Node a espanderlo e non la shell:
> ```json
> "test": "node --test \"src/**/*.test.ts\""
> ```

> **[avviso] riga 2 · ADR-005**  
> Problema: manca lo script `typecheck` e TypeScript non è installato.  
> Perché: il type stripping toglie i tipi senza controllarli. Un `string` passato al posto di un `number` arriva fino al bilanciere. Separare l'esecuzione dal controllo dei tipi è il principio del *fail fast*. Fa anche parte della roadmap › passo 1.  
> Prova:
> ```sh
> npm install -D typescript @types/node
> ```
> ```json
> "typecheck": "tsc --noEmit"
> ```
> Poi ti serve un `tsconfig.json` strict: chiedimelo in modalità NEW_FILE.

> **[info] riga 1 · best practice**  
> Problema: mancano `name`, `private` e `type`.  
> Perché: senza `"type": "module"`, Node deve indovinare se i file `.ts` sono ESM o CommonJS. `"private": true` evita di pubblicare il pacchetto su npm per errore.  
> Prova, il file completo:
> ```json
> {
>   "name": "mini-calc",
>   "version": "0.1.0",
>   "private": true,
>   "type": "module",
>   "bin": { "mini-calc": "src/cli/main.ts" },
>   "scripts": {
>     "test": "node --test \"src/**/*.test.ts\"",
>     "typecheck": "tsc --noEmit"
>   },
>   "engines": { "node": ">=22.18.0" },
>   "devDependencies": {
>     "@types/node": "^22.18.0",
>     "typescript": "^5.9.0"
>   }
> }
> ```
> `bin` rende disponibile il comando `mini-calc` dopo `npm link`. Il percorso è una proposta coerente con ADR-001 (`core` + `cli`).

**Domanda:** i file di test li vuoi accanto al sorgente (`src/core/plates.test.ts`) o in una cartella `test/` separata? Da questo dipende il glob dello script `test`.
