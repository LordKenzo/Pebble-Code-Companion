Ecco l'esempio completo, con i passi in ordine.

**1. Installa le librerie che servono solo a te mentre sviluppi**

Una *devDependency* è una libreria che ti serve per lavorare sul progetto (controllare i tipi, per esempio) ma non quando il programma gira. Qui ne bastano due: TypeScript per il controllo dei tipi e i tipi di Node. Per i test non installi niente, perché `node:test` è già dentro Node (ADR-005).

```sh
npm install -D typescript @types/node
```

npm le aggiunge da solo al `package.json`, sotto `devDependencies`. Non serve scriverle a mano (`best practice`).

**2. Il `package.json` corretto**

```json
{
  "name": "calcolatore-1rm",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.9.0"
  }
}
```

- `"private": true`: evita di pubblicare per sbaglio il progetto su npm (`best practice`).
- `"type": "module"`: fa leggere i file con `import`/`export` moderni. È lo stile che Node si aspetta per i `.ts` (`best practice`).
- `node --test`: questa è la correzione che mancava. Il flag `--test` avvia il *test runner*, cioè il programma che cerca i tuoi test, li esegue e ti dice quali passano. `node test` invece cercava di avviare un programma chiamato "test" (ADR-005).
- `"test/**/*.test.ts"` tra virgolette: dice a Node di cercare tutti i file che finiscono in `.test.ts` dentro `test/`. Le virgolette fanno sì che a cercare i file sia Node e non la shell, che altrimenti darebbe errore se non ne trova.
- `typecheck`: controlla i tipi senza produrre file. I test non lo fanno, perché Node si limita a togliere i tipi senza verificarli (ADR-005).
- I numeri di versione sotto `devDependencies` li scrive npm: i tuoi potrebbero essere diversi, va bene così.

**3. Il `tsconfig.json`, che serve a `tsc`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "types": ["node"]
  },
  "include": ["src", "test"]
}
```

- `allowImportingTsExtensions`: ti fa scrivere `import ... from "./epley.ts"` con l'estensione, come richiede Node quando esegue i `.ts` direttamente (ADR-005).
- `erasableSyntaxOnly`: segnala subito se usi `enum` o altre cose che il type stripping non supporta (ADR-005).
- `strict`: attiva i controlli più severi. Aiuta a trovare errori sui numeri e sugli input mancanti (`best practice`).

Per verificare che tutto funzioni, lancia `npm test` e `npm run typecheck`. Finché non c'è nessun file di test, `npm test` ti dirà che ha trovato 0 test: è normale, vuol dire che il runner è partito.
