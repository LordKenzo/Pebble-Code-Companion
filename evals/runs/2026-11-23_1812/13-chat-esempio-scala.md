Ecco il `package.json` completo, con lo script `test` corretto e la parte sulle librerie.

```json
{
  "name": "calcolo-1rm",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

Cosa fa ogni voce non ovvia:

- `"private": true`: impedisce di pubblicare per sbaglio il progetto su npm (il registro pubblico delle librerie). Fonte: `buona pratica`.
- `"type": "module"`: dice a Node di usare la sintassi `import`/`export`, quella moderna. Fonte: `buona pratica`.
- `node --test "…"`: la differenza dalla tua versione è `--test`. Senza questa opzione Node prova a eseguire `test` come se fosse un programma. Con `--test` avvia il test runner, cioè lo strumento che cerca i file di test e li esegue uno per uno. Lo schema tra virgolette gli dice di cercare in `test/` tutti i file che finiscono in `.test.ts`. Le virgolette servono perché sia Node a interpretare lo schema e non il terminale. Fonte: `ADR-005`.
- `"typecheck": "tsc --noEmit"`: controlla i tipi senza generare file. I test girano grazie al type stripping: Node cancella i tipi e non li verifica, quindi serve questo controllo separato. Fonte: `ADR-005`.
- `devDependencies`: è la lista delle dipendenze di sviluppo. Una dipendenza è un pezzo di codice altrui di cui il tuo progetto ha bisogno. "Di sviluppo" vuol dire che serve a te mentre lavori, non a chi usa il programma. TypeScript è l'unica: i test non richiedono librerie esterne (`ADR-005`).

Non serve scrivere a mano la voce `devDependencies`. Esegui:

```sh
npm install -D typescript
```

`-D` aggiunge la libreria a `devDependencies` e crea `package-lock.json`. Quel file registra le versioni esatte installate: va salvato insieme al progetto (`buona pratica`).

Per verificare che tutto funzioni:

1. Crea un file vuoto `test/prova.test.ts` con un solo test che controlla che `1 + 1` sia uguale a `2`.
2. Esegui `npm test`. Dovresti vedere `pass 1`.
3. Se non trova nessun test, controlla il nome del file: deve finire esattamente in `.test.ts`.
