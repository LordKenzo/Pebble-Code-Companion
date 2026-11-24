**Prima sistemiamo il file**

Ci sono errori che impediscono al file di partire, quindi il test non può ancora dirti nulla. Sistemiamoli in ordine.

1. **Libreria mancante.** `@testing-library/react` (un pacchetto che aiuta a controllare cosa compare sullo schermo) non è installato. Il progetto usa Vite, quindi come strumento di test (test runner) uso Vitest. Lancia nel terminale:
```sh
npm install -D vitest jsdom @testing-library/react @testing-library/dom
```

2. **Import mancante.** `describe`, `it` ed `expect` non arrivano da soli: vanno importati da Vitest. Aggiungi questa riga in cima al file, sotto la riga 1:
```ts
import { describe, it, expect } from 'vitest'
```

3. **Parentesi non chiusa.** Alla riga 3 apri due blocchi, `describe(... {` e `it(... {`, ma la riga 5 ne chiude uno solo. Aggiungi alla fine del file una riga che chiuda anche `describe`:
```ts
})
```

Quando questi errori spariscono, rilancia i test con `npx vitest`. Poi guardiamo insieme perché il test è rosso.
