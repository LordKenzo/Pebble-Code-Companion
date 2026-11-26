```json
{
  "reading": "Il passo 1 è completo: il progetto esiste e Vitest, Testing Library e jsdom sono installati (dipendenze: pezzi di codice che servono al tuo per funzionare). In `src/` c'è solo `App.tsx` con il suo test. Manca ancora del tutto la cartella `src/calculator/` (ADR-002). In questo passo scrivi solo i test, cioè piccoli programmi che controllano che il codice dia il risultato giusto. Le operazioni vere arrivano nel passo 3. I test quindi falliranno, ed è previsto. L'importante è che partano e falliscano perché la funzione non fa ancora il suo lavoro, non perché manca un file o un nome. Per questo il primo compito prepara il tipo del risultato, così test e funzioni parlano la stessa lingua (ADR-003). Per gli \"input non validi\" propongo una funzione a parte, `leggiNumero`, che trasforma il testo di un campo in numero. Così le quattro operazioni lavorano solo con numeri.",
  "tasks": [
    {
      "title": "Prepara il tipo del risultato",
      "todo": "Crea `src/calculator/risultato.ts` con un tipo che dice com'è fatto un risultato: un valore riuscito con dentro il numero, oppure un errore con dentro un messaggio (ADR-003: gli errori sono valori, non eccezioni). È solo una dichiarazione, non c'è logica da scrivere.",
      "signature": "export type Risultato = { ok: true; valore: number } | { ok: false; errore: string };",
      "doneWhen": "file src/calculator/risultato.ts esporta Risultato"
    },
    {
      "title": "Scrivi i test delle quattro operazioni",
      "todo": "Crea `src/calculator/operazioni.test.ts` (ADR-004: i calcoli si testano come funzioni, senza la pagina). I test importano `somma`, `sottrai`, `moltiplica` e `dividi` da `./operazioni`. Casi da coprire: \"2 + 3: fa 5\", \"10 - 4: fa 6\", \"3 - 5: fa -2\", \"4 × 2.5: fa 10\", \"7 × 0: fa 0\", \"10 ÷ 4: fa 2.5\", \"0.1 + 0.2: circa 0.3\". L'ultimo serve perché il computer fa i conti con i decimali in modo un po' impreciso. Cerca `toBeCloseTo` nella documentazione di Vitest (vitest.dev › API › expect).",
      "signature": "somma(a: number, b: number): Risultato  // uguale per sottrai, moltiplica, dividi",
      "doneWhen": "file src/calculator/operazioni.test.ts"
    },
    {
      "title": "Scrivi i test della divisione per zero",
      "todo": "Nello stesso file aggiungi i casi in cui `dividi` deve restituire un errore invece di un numero, senza far bloccare il programma (ADR-003): \"7 ÷ 0: errore divisione per zero\", \"0 ÷ 0: errore divisione per zero\", \"-3 ÷ 0: errore divisione per zero\". Controlla che `ok` sia `false` e che il messaggio parli di divisione per zero.",
      "signature": "",
      "doneWhen": "file src/calculator/operazioni.test.ts"
    },
    {
      "title": "Scrivi i test della lettura dei numeri",
      "todo": "Crea `src/calculator/leggiNumero.test.ts`. Qui si controlla la funzione che trasforma il testo scritto in un campo in un numero, oppure in un errore (ADR-003). Casi: \"campo vuoto: errore numero non valido\", \"\\\"abc\\\": errore numero non valido\", \"\\\"12\\\": diventa 12\", \"\\\"-3.5\\\": diventa -3.5\", \"\\\" 8 \\\": diventa 8, senza spazi\".",
      "signature": "leggiNumero(testo: string): Risultato",
      "doneWhen": "file src/calculator/leggiNumero.test.ts"
    },
    {
      "title": "Esegui i test e leggi perché falliscono",
      "todo": "Lancia `npx vitest run` nel terminale. Il test \"Pagina iniziale\" deve restare verde. I nuovi test saranno rossi: leggi il motivo di ognuno. Va bene se il motivo è che la funzione non esiste ancora. Non va bene se c'è un errore di battitura nel nome di un test o in un import (ADR-004).",
      "signature": "",
      "doneWhen": "test \"Pagina iniziale\""
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Rileggiamo insieme i test: i nomi sono chiari? Manca qualche caso limite? I messaggi d'errore sono quelli che vuoi mostrare sulla pagina?",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "In Italia si scrive spesso \"3,5\" con la virgola: vuoi che `leggiNumero` accetti anche la virgola come separatore dei decimali? Se sì, aggiungiamo il test \"\\\"3,5\\\": diventa 3.5\"."
}
```
