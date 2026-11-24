**Prima sistemiamo il file**

Il file non compila ancora, quindi il test non può dirci nulla. Tre correzioni, in quest'ordine:

1. **Librerie mancanti.** Una *dipendenza* è un pezzo di codice di altri che il tuo usa per funzionare. Qui manca Testing Library. Installala insieme a Vitest (lo strumento che esegue i test, quello standard nei progetti Vite) e a jsdom (una finta pagina web in cui i test possono girare):
   ```sh
   npm install -D vitest @testing-library/react @testing-library/dom jsdom
   ```
   `best practice`

2. **Import mancanti.** `describe`, `it` ed `expect` non esistono finché non li importi. La prima riga dice a Vitest di usare la finta pagina web. Mettile in cima al file, prima della riga 1:
   ```ts
   // @vitest-environment jsdom
   import { describe, it, expect } from 'vitest'
   ```
   `best practice`

3. **Parentesi non chiusa.** La riga 5 chiude solo `it(…`, mentre `describe(…` della riga 3 resta aperto. Per questo l'editor segnala `'}' expected` alla riga 7. Aggiungi una riga alla fine:
   ```ts
   })
   ```

Quando gli errori nell'editor spariscono, lancia `npx vitest`. Da lì guardiamo insieme cosa dice il test.
