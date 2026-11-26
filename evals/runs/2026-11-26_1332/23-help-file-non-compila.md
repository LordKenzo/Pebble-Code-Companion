**Prima sistemiamo il file**

Il file ha errori, quindi il test non può ancora partire. Ecco tre correzioni, in quest'ordine:

1. **Installa le librerie che mancano** (una *libreria* è codice scritto da altri che il tuo usa). Nel terminale, nella cartella del progetto:
   ```sh
   npm install -D vitest @testing-library/react jsdom
   ```
   `vitest` è il programma che esegue i test. `@testing-library/react` serve a leggere la pagina, `jsdom` simula un browser. Il flag `-D` le installa solo per lo sviluppo (`best practice`). Ho scelto Vitest perché il progetto usa Vite e i due funzionano bene insieme (`best practice`).

2. **Importa `describe`, `it` ed `expect`.** Aggiungi questa riga sotto la riga 1:
   ```ts
   import { describe, it, expect } from 'vitest'
   ```
   Queste tre parole non esistono finché non dici a TypeScript da dove vengono.

3. **Chiudi la parentesi mancante.** La riga 5 chiude `it(...`, ma `describe(...` della riga 3 resta aperto. Aggiungi `})` su una nuova riga alla fine del file.

Quando questi errori spariscono, guardiamo cosa fa il test.
