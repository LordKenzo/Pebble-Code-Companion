**Prima sistemiamo il file**

Finché ci sono questi errori il test non può partire. Correggili in quest'ordine:

1. **Libreria mancante.** Una libreria è codice scritto da altri che il tuo progetto usa. Qui manca quella per testare React. Nel terminale:
```sh
npm install -D vitest @testing-library/react jsdom
```

2. **`describe`, `it`, `expect` non trovati.** Vengono da Vitest, il programma che esegue i test nei progetti Vite, e vanno importati. Aggiungi questa riga sotto la riga 1:
```ts
import { describe, it, expect } from 'vitest'
```

3. **Parentesi non chiusa.** La riga 5 chiude solo `it(...)`. Manca la chiusura di `describe(...)`: aggiungi `})` su una nuova riga 6.
