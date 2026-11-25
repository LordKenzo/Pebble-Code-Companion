```json
{
  "reading": "Il passo 1 è completo: il progetto Vite con React e TypeScript esiste, Vitest, Testing Library e jsdom sono installati, e la pagina iniziale ha il suo test (src/App.test.tsx). La cartella src/calculator/ non esiste ancora: in questo passo la creiamo solo per i tipi e per i test. Un test è un piccolo programma che controlla se il tuo codice dà il risultato atteso. Le operazioni vere le scriverai nel passo 3. Per ora i test devono partire e risultare rossi (falliti): è normale, perché le funzioni da controllare non ci sono ancora.",
  "tasks": [
    {
      "title": "Definisci il tipo del risultato",
      "todo": "Crea src/calculator/types.ts con un tipo Risultato. Un tipo è una descrizione della forma di un dato. Questo può essere un successo, con il numero calcolato, oppure un errore, con un messaggio. Così divisione per zero e input non validi diventano valori da mostrare e non eccezioni (ADR-003). Il file non contiene calcoli, ma solo la descrizione dei dati (ADR-002).",
      "signature": "export type Risultato = { ok: true; valore: number } | { ok: false; errore: string };",
      "doneWhen": [
        "file src/calculator/types.ts esporta Risultato",
        "nessun errore in src/calculator/types.ts"
      ]
    },
    {
      "title": "Scrivi i test delle quattro operazioni",
      "todo": "Crea src/calculator/operations.test.ts con Vitest (ADR-004). Ogni test chiama una delle funzioni somma, sottrai, moltiplica e dividi, importate da ./operations. Poi controlla il Risultato. Prima scrivi i casi di errore (ADR-003): \"10 / 0: errore di divisione per zero\", \"NaN + 2: errore di input non valido\", \"Infinity * 2: errore di input non valido\". Poi scrivi i casi base: \"2 + 3: 5\", \"10 - 4: 6\", \"-3 * 4: -12\", \"9 / 3: 3\", \"7 / 2: 3.5\". Le altre tre funzioni hanno la stessa forma di somma.",
      "signature": "export function somma(a: number, b: number): Risultato",
      "doneWhen": [
        "file src/calculator/operations.test.ts"
      ]
    },
    {
      "title": "Aggiungi il test dei numeri decimali",
      "todo": "Nello stesso file aggiungi il test \"0.1 + 0.2: 0.3\". Nel computer i numeri con la virgola non sono sempre esatti, quindi qui un confronto con uguale stretto fallirebbe anche con una somma giusta. Cerca nella documentazione di Vitest (vitest.dev › API › expect) il controllo che confronta i numeri 'quasi uguali'.",
      "signature": "",
      "doneWhen": [
        "file src/calculator/operations.test.ts"
      ]
    },
    {
      "title": "Esegui i test e leggi perché falliscono",
      "todo": "Nel terminale lancia npx vitest run. I test della pagina devono restare verdi. Quelli dei calcoli devono fallire perché src/calculator/operations.ts non esiste ancora: è il risultato atteso di questo passo. Se fallissero per un altro motivo, per esempio un errore di scrittura nel file di test, sistemalo ora.",
      "signature": "",
      "doneWhen": [
        "test \"Pagina iniziale\""
      ]
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Chiedi una revisione di src/calculator/operations.test.ts e src/calculator/types.ts. Controlleremo che i casi di errore restituiscano un Risultato e non lancino eccezioni (ADR-003), e che nessun test usi React (ADR-002).",
      "signature": "",
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "I campi della pagina daranno alle operazioni del testo (come \"12\" o \"abc\") oppure numeri già convertiti? Da questo dipende cosa conta come input non valido nei test."
}
```
