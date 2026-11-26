```json
{
  "reading": "Il passo 1 è completo: Vite, React, TypeScript, Vitest, Testing Library e jsdom sono installati, e `src/App.test.tsx` ha già il test \"Pagina iniziale\". La cartella `src/calculator/` non esiste ancora (ADR-002). In questo passo scrivi solo i test, cioè piccoli programmi che controllano se il tuo codice dà il risultato atteso. Per poterli eseguire serve un file con i nomi delle funzioni. Il calcolo vero arriva nel passo 3. Per ora è normale che i test siano rossi (falliti), ma devono fallire perché il risultato è sbagliato, non perché manca un file o c'è un errore di battitura. Ho supposto che le operazioni ricevano numeri, non testo.",
  "tasks": [
    {
      "title": "Prepara il modulo calculator con le firme",
      "todo": "Crea `src/calculator/calculator.ts`. Dentro dichiara il tipo `Risultato` e le quattro funzioni pure, cioè funzioni che dipendono solo dai numeri che ricevono e non usano React (ADR-002). Il risultato può essere un valore oppure un messaggio d'errore, mai un'eccezione lanciata (ADR-003). Per ora ogni funzione restituisce l'errore \"non ancora implementato\": così i test partono e falliscono in modo chiaro.",
      "signature": "export type Risultato = { ok: true; valore: number } | { ok: false; errore: string };\nexport function somma(a: number, b: number): Risultato;\nexport function sottrai(a: number, b: number): Risultato;\nexport function moltiplica(a: number, b: number): Risultato;\nexport function dividi(a: number, b: number): Risultato;",
      "doneWhen": [
        "file src/calculator/calculator.ts esporta Risultato",
        "file src/calculator/calculator.ts esporta dividi",
        "nessun errore in src/calculator/calculator.ts"
      ]
    },
    {
      "title": "Scrivi i test dei risultati delle quattro operazioni",
      "todo": "Crea `src/calculator/calculator.test.ts` con Vitest (ADR-004) e chiama le funzioni direttamente, senza la pagina. Casi da coprire: \"8 ÷ 2: fa 4\", \"7 ÷ 2: fa 3.5\", \"2 + 3: fa 5\", \"-4 + 1: fa -3\", \"10 - 4: fa 6\", \"3 - 5: fa -2\", \"6 × 7: fa 42\", \"5 × 0: fa 0\". Ogni test controlla che `ok` sia vero e che `valore` sia quello atteso.",
      "signature": "",
      "doneWhen": [
        "file src/calculator/calculator.test.ts",
        "nessun errore in src/calculator/calculator.test.ts"
      ]
    },
    {
      "title": "Scrivi i test dei casi di errore",
      "todo": "Nello stesso file aggiungi i casi in cui la funzione restituisce un messaggio invece di lanciare un'eccezione (ADR-003): \"8 ÷ 0: messaggio di divisione per zero\", \"0 ÷ 0: messaggio di divisione per zero\", \"NaN + 2: messaggio di input non valido\", \"Infinity × 2: messaggio di input non valido\", \"0.1 + 0.2: circa 0.3\". L'ultimo serve perché i numeri decimali nei computer non sono esatti: cerca `toBeCloseTo` nella documentazione di Vitest (vitest.dev, sezione API › expect). Poi esegui `npx vitest run` e controlla che ogni test fallito dica \"non ancora implementato\" o mostri un valore sbagliato, non un errore di importazione.",
      "signature": "",
      "doneWhen": [
        "nessun errore in src/calculator/calculator.test.ts"
      ]
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Fai rileggere a Pebble `calculator.test.ts` e `calculator.ts`. Controllate insieme che i nomi dei test descrivano i casi, che gli errori siano valori (ADR-003) e che nessun test usi React (ADR-002).",
      "signature": "",
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "Nella pagina i numeri arriveranno dai campi come testo: vuoi che le funzioni di calculator ricevano già numeri, con la pagina che converte il testo, oppure che ricevano il testo e controllino loro se è un numero valido?"
}
```
