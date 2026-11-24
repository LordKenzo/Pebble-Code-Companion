**Sistemiamo prima il file**

Finché il file non compila, il test non può dirti nulla.

1. **Libreria mancante (riga 1).** Una *dipendenza* è codice di altri che il tuo progetto usa. Questa non è installata. Esegui nel terminale:
```sh
npm install -D vitest @testing-library/react jsdom
```

2. **`describe`, `it`, `expect` sconosciuti (righe 3-4).** Vanno *importati*, cioè presi da Vitest. Aggiungi sotto la riga 1:
```ts
import { describe, it, expect } from 'vitest'
```

3. **Parentesi aperta (riga 7).** La riga 5 chiude solo `it`. Manca la chiusura di `describe`. Aggiungi in fondo:
```ts
})
```

Quando gli errori spariscono, guardiamo il test.
