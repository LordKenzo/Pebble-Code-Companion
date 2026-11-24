```json
{
  "reading": "Il passo 1 è completo: il progetto Vite con React e TypeScript esiste, Vitest e Testing Library sono installati e `src/App.test.tsx` passa, quindi i test si possono già eseguire. Manca ancora la cartella `src/calculator/` (ADR-002). In questo passo scrivi i test dei calcoli e prepari solo le firme. Una firma è la riga che dice il nome della funzione, cosa riceve e cosa restituisce. Le operazioni vere le scrivi al passo 3, quindi è normale che qui i test siano rossi, cioè che falliscano.",
  "tasks": [
    {
      "title": "Scrivi i test delle quattro operazioni e degli errori",
      "todo": "Crea `src/calculator/operazioni.test.ts` e scrivi un test per ognuno di questi casi, mettendo per primi i casi di errore (ADR-003, ADR-004): \"10 / 0: errore divisione per zero\", \"NaN + 1: errore input non valido\", \"Infinity * 2: errore input non valido\", \"2 + 3: fa 5\", \"7 - 10: fa -3\", \"4 * 2.5: fa 10\", \"9 / 3: fa 3\", \"0 / 5: fa 0\", \"0.1 + 0.2: circa 0.3\". Nei casi di errore controlla che arrivi un messaggio d'errore e che non venga lanciata un'eccezione. Un'eccezione è un errore che interrompe il programma. Per 0.1 + 0.2 cerca nella documentazione di Vitest la verifica `toBeCloseTo`: con i numeri decimali il computer non dà sempre il valore esatto.",
      "signature": "",
      "doneWhen": ["file src/calculator/operazioni.test.ts"]
    },
    {
      "title": "Prepara le firme delle operazioni",
      "todo": "Crea `src/calculator/operazioni.ts` con il tipo `Risultato` e le quattro funzioni pure, cioè funzioni che usano solo i numeri che ricevono e non toccano React (ADR-002). Dentro ogni funzione, per ora, restituisci soltanto un errore con il testo \"non ancora fatta\" (ADR-003). Il calcolo vero arriva al passo 3: così i test partono e falliscono per il motivo giusto.",
      "signature": "export type Risultato = { ok: true; valore: number } | { ok: false; errore: string };\nexport function somma(a: number, b: number): Risultato\nexport function sottrai(a: number, b: number): Risultato\nexport function moltiplica(a: number, b: number): Risultato\nexport function dividi(a: number, b: number): Risultato",
      "doneWhen": [
        "file src/calculator/operazioni.ts esporta somma",
        "file src/calculator/operazioni.ts esporta sottrai",
        "file src/calculator/operazioni.ts esporta moltiplica",
        "file src/calculator/operazioni.ts esporta dividi"
      ]
    },
    {
      "title": "Esegui i test e leggi perché falliscono",
      "todo": "Lancia `npx vitest run` nel terminale. Controlla che il file dei test non mostri errori di import o di scrittura, e che ogni test rosso fallisca perché riceve \"non ancora fatta\" invece del valore atteso (ADR-004). Il test di `App.test.tsx` deve restare verde.",
      "signature": "",
      "doneWhen": ["nessun errore in src/calculator/operazioni.test.ts"]
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Chiedi una revisione di `operazioni.test.ts`, per vedere se mancano casi importanti e se i nomi dei test descrivono bene cosa ti aspetti.",
      "signature": "",
      "doneWhen": ["a mano"]
    }
  ],
  "question": "Quando la pagina chiamerà queste funzioni, i valori dei campi arriveranno già come numeri oppure come testo scritto dall'utente, che va controllato prima (per esempio \"abc\")?"
}
```
