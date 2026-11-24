**Prima sistemiamo il file**

Ci sono errori che impediscono al file di partire, quindi il test non può ancora dirti nulla. Tre correzioni, in quest'ordine:

1. **Installa la libreria che manca.** Una *libreria* è codice scritto da altri che il tuo progetto usa. `@testing-library/react` non è installata. Lancia nel terminale, dalla cartella del progetto:
   ```sh
   npm install -D @testing-library/react @testing-library/dom
   ```
   `-D` la segna come strumento di sviluppo, che non finisce nell'app finale (`best practice`).

2. **Importa le funzioni dei test.** `describe`, `it` ed `expect` vengono dallo strumento che esegue i test. Do per scontato che sia Vitest, quello abituale con Vite. Aggiungi sotto la riga 1:
   ```ts
   import { describe, it, expect } from 'vitest'
   ```

3. **Chiudi la parentesi.** Alla riga 5 chiudi `it`, ma il `describe` aperto alla riga 3 resta aperto. Aggiungi in fondo al file una riga con:
   ```ts
   })
   ```

Quando gli errori sono spariti, lancia `npx vitest`. Così vediamo cosa dice il test.
