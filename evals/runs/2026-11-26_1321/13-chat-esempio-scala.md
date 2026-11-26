**Gradino 3 · Esempio analogo**

In questa parte (comandi e configurazione) ti do direttamente la soluzione completa.

**1. Lo script `test`**

`node test` dice a Node di eseguire un file chiamato `test` come se fosse un programma normale. Per avviare il **test runner**, cioè lo strumento che trova i tuoi test, li esegue e ti dice quali passano, serve l'opzione `--test` (`ADR-005`).

```json
{
  "name": "calcolatore-1rm",
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

Cosa fa ogni voce nuova:
- `"private": true` impedisce di pubblicare il progetto su npm per sbaglio (`best practice`).
- `"type": "module"` fa usare a Node la sintassi `import`/`export`, quella moderna (`best practice`).
- `--test "test/**/*.test.ts"` avvia il runner sui file che finiscono in `.test.ts` dentro `test/`, anche nelle sottocartelle. Le virgolette fanno sì che lo schema lo legga Node e non il terminale.
- `typecheck` controlla che i tipi siano corretti senza produrre file (`ADR-005`).

**2. Le librerie**

Una **dipendenza** è un pezzo di codice di altri che serve al tuo progetto. Ne esistono due tipi:
- `dependencies`: servono quando il programma gira. Per ora non ne hai.
- `devDependencies`: servono solo a te mentre sviluppi.

TypeScript serve solo per il controllo dei tipi, perché è Node a eseguire i `.ts` (`ADR-005`). Quindi va tra le devDependencies:

```sh
npm install -D typescript @types/node
```

- `-D` sta per "dev": npm crea da solo la sezione `devDependencies` nel `package.json` e ci scrive le versioni. Non devi scriverle a mano.
- `@types/node` descrive a TypeScript gli strumenti di Node, per esempio `node:test` e `process`.

**Prova così:**
1. Sostituisci il tuo `package.json` con quello sopra e lancia il comando di installazione.
2. Crea `test/setup.test.ts` con un solo test che verifica `1 + 1 === 2`, usando `test` da `node:test` e `assert` da `node:assert`.
3. Lancia `npm test`: deve comparire un test verde. Se non trova file, controlla che il nome finisca proprio in `.test.ts`.

Per approfondire, sulla documentazione di Node (nodejs.org/docs) apri la pagina **Test runner** e cerca la sezione "Running tests from the command line".
