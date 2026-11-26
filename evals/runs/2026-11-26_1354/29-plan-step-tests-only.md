{
  "reading": "Il passo 1 risulta completato: progetto, strumenti di test e un test della pagina iniziale (`src/App.test.tsx`). Nell'elenco dei file non c'è ancora `src/calculator/`, la cartella che l'ADR-002 destina ai calcoli. In questo passo scrivi i test, cioè piccoli controlli automatici che dicono quale risultato ti aspetti. Aggiungi anche una funzione provvisoria per poterli eseguire. I calcoli veri arrivano al passo 3, quindi è normale che qui i test falliscano.",
  "tasks": [
    {
      "title": "Scrivi i test delle quattro operazioni",
      "todo": "Crea `src/calculator/calculate.test.ts`. Ogni test chiama `calculate` passando i due numeri come testo, come arriveranno dai campi della pagina, e l'operazione. Poi controlla l'intero oggetto restituito (`ok` vale true e `value` è il numero atteso). Usa questi nomi: \"2 + 3: risultato 5\", \"5 - 8: risultato -3\", \"4 × 2.5: risultato 10\", \"9 ÷ 2: risultato 4.5\", \"0 ÷ 5: risultato 0\" (ADR-002, ADR-004).",
      "signature": "export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';\nexport type Result = { ok: true; value: number } | { ok: false; error: string };\nexport declare function calculate(a: string, operation: Operation, b: string): Result;",
      "doneWhen": "test \"2 + 3\" \"5 - 8\" \"4 × 2.5\" \"9 ÷ 2\" \"0 ÷ 5\""
    },
    {
      "title": "Scrivi i test dei casi di errore",
      "todo": "Nello stesso file controlla che `ok` valga false e che `error` sia il messaggio esatto: \"Non si può dividere per zero\" oppure \"Inserisci un numero valido\". Usa questi nomi: \"8 ÷ 0: errore divisione per zero\", \"primo campo vuoto: errore input non valido\", \"secondo campo abc: errore input non valido\", \"campo di soli spazi: errore input non valido\". La funzione non deve lanciare eccezioni (cioè interrompersi con un errore): restituisce il messaggio come un normale risultato (ADR-003, ADR-004).",
      "signature": null,
      "doneWhen": "test \"8 ÷ 0\" \"primo campo vuoto\" \"secondo campo abc\" \"campo di soli spazi\""
    },
    {
      "title": "Prepara la funzione provvisoria ed esegui i test",
      "todo": "Crea `src/calculator/calculate.ts` con i due tipi (descrizioni della forma dei dati) e la funzione `calculate`. Per ora deve solo restituire sempre un risultato con `ok` false e il messaggio \"Non ancora implementato\", senza fare calcoli e senza usare React (ADR-002). Importa la funzione nel file di test, poi nel terminale, dalla cartella del progetto, esegui `npx vitest run`. I nuovi test devono partire e fallire perché il risultato è diverso da quello atteso, non perché manca un file o un'importazione.",
      "signature": "export declare function calculate(a: string, operation: Operation, b: string): Result;",
      "doneWhen": "file src/calculator/calculate.ts esporta calculate"
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Chiedi una revisione di `calculate.test.ts` e `calculate.ts`: controlliamo che ogni caso abbia il risultato atteso giusto e che i test falliscano per il motivo corretto (ADR-003, ADR-004).",
      "signature": null,
      "doneWhen": "a mano"
    }
  ],
  "question": "Chi usa la calcolatrice deve poter scrivere i decimali anche con la virgola (per esempio «2,5»), oltre che con il punto?"
}
