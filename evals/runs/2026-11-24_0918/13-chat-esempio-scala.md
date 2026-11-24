Ecco il `package.json` completo, poi il comando per le librerie.

**1. Il file `package.json`**

```json
{
  "name": "calcolatore-1rm",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

Le righe meno ovvie:

- `"private": true` impedisce di pubblicare il progetto su npm per sbaglio (`best practice`).
- `"type": "module"` dice a Node che i file usano `import`/`export`, la sintassi moderna per collegare i file tra loro (`best practice`).
- `"test"` usa `--test`, cioè la modalità test di Node. Prima, `node test` cercava di *eseguire* un file chiamato `test` come programma. Il pattern tra virgolette dice a Node quali file sono test: tutti quelli che finiscono in `.test.ts` dentro `test/`. I `.ts` girano senza compilazione grazie al type stripping (`ADR-005`).
- `"typecheck"` controlla i tipi senza produrre file (`ADR-005`).

**2. Le librerie**

Una *dipendenza* è codice scritto da altri che serve al tuo progetto. Le dipendenze si dividono in due gruppi:

- `dependencies`: servono quando il programma gira.
- `devDependencies`: servono solo a te mentre sviluppi, per esempio per i controlli e i test.

Il calcolo non ha bisogno di librerie e i test usano `node:test`, che è già dentro Node (`ADR-005`). Ti servono solo due strumenti di sviluppo:

```sh
npm install -D typescript @types/node
```

- `-D` li mette in `devDependencies`.
- `typescript` fornisce il comando `tsc`.
- `@types/node` descrive i tipi di `node:test` e `node:assert`, così l'editor li riconosce.

Il blocco `devDependencies` non lo scrivi a mano: lo aggiunge npm da solo al `package.json`, con le versioni giuste.

**Per verificare**

1. Lancia `npm test`. Se la cartella `test/` è vuota, il runner parte comunque e riporta 0 test. È il segnale che funziona.
2. `npm run typecheck` richiede anche un `tsconfig.json`. È il prossimo file da preparare: chiedimelo quando ci arrivi.
