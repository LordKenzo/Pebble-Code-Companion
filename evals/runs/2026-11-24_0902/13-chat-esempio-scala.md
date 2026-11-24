Ecco il `package.json` completo: lo script `test` è corretto e le librerie sono già dichiarate.

**1. Installa le librerie di sviluppo**

```sh
npm install -D typescript @types/node
```

- `-D` sta per "di sviluppo": servono a te mentre scrivi e controlli il codice, non a chi usa il programma. npm le scrive da solo in `devDependencies`, quindi quella sezione non la tocchi a mano (`buona pratica`).
- `typescript` ti dà `tsc`, che controlla i tipi senza produrre file (`ADR-005`).
- `@types/node` descrive a TypeScript i moduli di Node, come `node:test` e `node:assert`.

**2. Il file come deve risultare**

```json
{
  "name": "one-rep-max",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" },
  "devDependencies": {
    "@types/node": "^22.18.0",
    "typescript": "^5.9.0"
  }
}
```

- `"private": true` impedisce di pubblicare il progetto su npm per sbaglio (`buona pratica`).
- `"type": "module"` dice a Node di leggere i file con `import`/`export`, lo stile moderno dei moduli (`buona pratica`).
- `node --test` avvia il test runner nativo (`ADR-005`). Il vecchio `node test` provava invece a eseguire `test` come un programma qualsiasi.
- `"test/**/*.test.ts"` dice a Node quali file sono test: tutti quelli che finiscono in `.test.ts` dentro `test/`, anche nelle sottocartelle. Le virgolette `\"` servono perché il percorso lo espanda Node e non la shell.
- `typecheck` controlla i tipi. Il type stripping li toglie senza verificarli, quindi questo controllo va lanciato a parte (`ADR-005`).
- I numeri di versione che scrive npm possono essere diversi da questi: va bene così.

**3. Verifica**

```sh
npm test
npm run typecheck
```

Se in `test/` non c'è ancora nessun file `.test.ts`, `npm test` segnala che non ha trovato test. È il momento giusto per scrivere il primo, dentro `test/core/`.
