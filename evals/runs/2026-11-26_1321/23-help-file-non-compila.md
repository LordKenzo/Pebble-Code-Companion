**Prima sistemiamo il file**

Il file ha errori che impediscono di avviarlo, quindi il test non può ancora dirci nulla. Tre correzioni, in quest'ordine:

1. **Libreria mancante.** `@testing-library/react` (una *dipendenza*, cioè codice esterno che il tuo progetto usa per funzionare) non è installata. Nel terminale:
   ```sh
   npm install -D vitest @testing-library/react @testing-library/dom jsdom
   ```
   `-D` la segna come strumento di sviluppo, non serve all'app finita. Uso Vitest perché il progetto è fatto con Vite e Vitest è il programma di test pensato per Vite (`best practice`, non c'è un ADR che lo decida).

2. **`describe`, `it`, `expect` sconosciuti.** Sono le parole che servono per scrivere i test e vanno importate da Vitest. Aggiungi questa riga in cima, sotto la riga 1:
   ```ts
   import { describe, it, expect } from 'vitest'
   ```

3. **Parentesi non chiusa.** Alla riga 3 apri due blocchi, `describe(… {` e `it(… {`, ma la riga 5 ne chiude solo uno. Aggiungi una riga 6 con `})` per chiudere il `describe`.

Quando l'editor non segnala più errori, rilancia i test. Il compito dice che il test deve chiamarsi "Pagina iniziale": ripartiamo da lì.
