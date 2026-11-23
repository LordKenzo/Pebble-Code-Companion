**Prima sistemiamo il file**

Finché il file ha errori, il test non può nemmeno partire. Sistemiamo questi tre punti, in ordine.

1. **Librerie mancanti.** Una libreria è codice scritto da altri che il tuo progetto usa. Qui `@testing-library/react` non è installata. Esegui nel terminale:
```sh
npm install -D vitest @testing-library/react @testing-library/dom jsdom
```

2. **`describe`, `it` ed `expect` non sono definiti.** Sono funzioni di Vitest, lo strumento che esegue i test, e vanno importate. Aggiungi questa riga in cima al file:
```ts
import { describe, it, expect } from 'vitest'
```

3. **Manca una parentesi di chiusura.** La riga 3 apre due blocchi, `describe(` e `it(`, ma la riga 5 ne chiude solo uno. Aggiungi questa riga in fondo al file, dopo la riga 5:
```ts
})
```
