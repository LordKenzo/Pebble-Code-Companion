Ecco il `package.json` completo, con lo script `test` corretto.

```json
{
  "name": "calcolo-1rm",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "engines": {
    "node": ">=22.18.0"
  }
}
```

Cosa fa ogni voce:

- `"private": true` impedisce di pubblicare il progetto su npm per sbaglio (`buona pratica`).
- `"type": "module"` dice a Node di usare la sintassi moderna `import … from …` (`buona pratica`).
- `node --test` avvia il test runner nativo, cioè il programma che trova ed esegue i test (`ADR-005`). Il tuo `node test` invece prova a eseguire la cartella `test` come se fosse un programma.
- `"test/**/*.test.ts"` è un *glob*, uno schema per indicare dei file: "tutti i file che finiscono in `.test.ts` dentro `test`, anche nelle sottocartelle". Le virgolette servono perché Node riceva lo schema così com'è, senza che il terminale lo interpreti prima.
- `typecheck` controlla i tipi senza produrre file (`ADR-005`).

**Le librerie.** Non si scrivono a mano: le aggiunge npm. Una *devDependency* è uno strumento che serve solo mentre sviluppi, non quando il programma gira.

```sh
npm install -D typescript @types/node
```

- `typescript` fornisce il comando `tsc`.
- `@types/node` contiene la descrizione dei tipi di Node, così `tsc` riconosce `node:test` e `node:assert`.

Dopo il comando, nel `package.json` compare da solo un blocco `"devDependencies"` con i numeri di versione.

**Per verificare che funzioni**, crea `test/setup.test.ts` con queste righe:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
test("il runner trova i test", () => assert.equal(1, 1));
```

Poi esegui `npm test`: deve comparire un test superato. Se non vedi nessun test, controlla il nome del file e la cartella.

Il passo successivo è il `tsconfig.json`, cioè la configurazione di `tsc`. Serve per far funzionare `npm run typecheck` con il type stripping: se vuoi, te lo preparo.
