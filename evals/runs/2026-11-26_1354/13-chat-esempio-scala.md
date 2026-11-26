Ecco lo script corretto, che avvia il test runner integrato di Node (ADR-005).

```json
{
  "scripts": {
    "test": "node --test",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=22.18.0" }
}
```

Cosa cambia:
- `node --test` avvia il **test runner**, cioè il programma che trova ed esegue i test. Cerca da solo i file di test, per esempio quelli nella cartella `test` o con nome `*.test.ts`. Il comando `node test` invece cercava di eseguire la cartella come programma, per questo non funzionava.
- `typecheck` controlla i tipi con TypeScript senza generare file. Serve perché Node esegue i `.ts` togliendo i tipi senza verificarli (ADR-005).

Per i test non serve nessuna libreria: ADR-005 le vieta. Per il controllo dei tipi serve TypeScript, che è uno strumento da sviluppo:

```sh
npm install -D typescript
```

Il flag `-D` lo registra in `devDependencies`, con la versione scelta da npm. Non serve scriverlo a mano.

**Concetto:** `devDependencies` contiene ciò che serve solo mentre sviluppi e testi. `dependencies` contiene ciò che serve al programma mentre gira. Se una libreria servisse a runtime, la installeresti con `npm install` senza `-D`.

Per verificare: `npm test` deve dire di aver trovato i test, e `npm run typecheck` deve finire senza errori.

Nel nostro progetto, TypeScript va in `dependencies` o in `devDependencies`, e perché?
