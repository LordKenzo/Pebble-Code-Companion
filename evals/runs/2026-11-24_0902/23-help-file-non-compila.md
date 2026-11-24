**Prima sistemiamo il file**

Ci sono errori che bloccano il test (cioè il controllo automatico che verifica il tuo codice). Finché ci sono, non può partire.

1. **Librerie mancanti (riga 1).** Una libreria è codice scritto da altri che il tuo progetto usa. Questa non è installata. Con Vite si usa Vitest per i test (`buona pratica`):
```sh
npm install -D vitest jsdom @testing-library/react @testing-library/dom
```

2. **`describe`, `it`, `expect` sconosciuti (righe 3-4).** Sono funzioni di Vitest e vanno importate. Aggiungi questa riga sotto la riga 1:
```ts
import { describe, it, expect } from 'vitest'
```

3. **Parentesi non chiusa (riga 7).** Alla riga 3 apri due blocchi, `describe(… {` e `it(… {`. La riga 5 chiude solo `it`. Aggiungi alla riga 6:
```ts
})
```

Quando l'editor non segna più errori, lancia `npx vitest` e guardiamo insieme cosa dice il test.
