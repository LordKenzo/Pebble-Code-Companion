**Gradino 3 · esempio completo**

Ecco come sistemare il `package.json`. Così lo script `test` avvia davvero il test runner (il programma che trova ed esegue i test) e le librerie risultano dichiarate.

**1. Sostituisci il contenuto del `package.json` con questo:**

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

- `"private": true` impedisce di pubblicare per errore il progetto su npm, il negozio pubblico di librerie (`best practice`).
- `"type": "module"` dice a Node di usare `import`/`export`, la sintassi moderna per collegare i file tra loro (`best practice`).
- `node --test` avvia il runner nativo di Node (`ADR-005`). Lo schema tra virgolette indica dove cercare: tutti i file che finiscono in `.test.ts` dentro `test/`. Le virgolette servono perché il terminale non lo interpreti prima di Node.
- `tsc --noEmit` controlla i tipi senza produrre file, perché Node esegue i `.ts` direttamente (`ADR-005`).

**2. Installa le librerie dal terminale:**

```sh
npm install -D typescript @types/node
```

- Una *dipendenza* è un pezzo di codice di cui il tuo ha bisogno per funzionare. Con `-D` diventa una *devDependency*, cioè serve solo mentre sviluppi e non quando il programma gira (`best practice`).
- Non scrivi tu le righe a mano: npm aggiunge da solo la sezione `"devDependencies"` al `package.json`, con le versioni giuste.
- `typescript` fornisce il comando `tsc`. `@types/node` insegna a TypeScript i tipi di `node:test` e `node:assert` (`ADR-005`).

Per i test non serve installare nient'altro: `node:test` è già dentro Node (`ADR-005`).

**3. Verifica che tutto funzioni:**

```sh
npm test
```

Se la cartella `test/` è ancora vuota, Node ti dirà che ha trovato 0 test. È normale: vuol dire che il runner parte. Il passo successivo è scrivere il primo file `test/qualcosa.test.ts`.
