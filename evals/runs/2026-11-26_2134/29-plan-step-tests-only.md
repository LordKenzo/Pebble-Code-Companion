```json
{
  "reading": "Il passo 1 è completo: c'è il progetto con Vite, Vitest e Testing Library sono installati, e `src/App.test.tsx` controlla la pagina iniziale. La cartella `src/calculator/` non esiste ancora. In questo passo scrivi solo i test, cioè piccoli programmi che controllano se una funzione dà il risultato atteso, per le quattro operazioni e per i casi di errore. All'inizio i test saranno rossi (falliti), ed è giusto così: le operazioni vere le scrivi nel passo 3. Perché i test possano almeno partire, serve un file con i nomi delle funzioni, che per ora restituiscono soltanto un errore \"da fare\".",
  "tasks": [
    {
      "title": "Scrivi i test dei casi di errore",
      "todo": "Crea `src/calculator/errori.test.ts`. Secondo ADR-003 un errore è un valore restituito, non un'eccezione: ogni test controlla che il risultato abbia `ok: false` e un messaggio. Casi: \"5 ÷ 0: messaggio di errore\", \"0 ÷ 0: messaggio di errore\", \"NaN + 1: messaggio di errore\", \"2 × NaN: messaggio di errore\".",
      "signature": "",
      "doneWhen": "file src/calculator/errori.test.ts"
    },
    {
      "title": "Scrivi i test delle quattro operazioni",
      "todo": "Crea `src/calculator/operazioni.test.ts` con Vitest (ADR-004). Ogni test chiama la funzione e controlla che il risultato abbia `ok: true` e il valore giusto. Casi: \"2 + 3: fa 5\", \"-4 + 1: fa -3\", \"10 - 4: fa 6\", \"3 - 5: fa -2\", \"4 × 5: fa 20\", \"7 × 0: fa 0\", \"10 ÷ 4: fa 2.5\", \"-9 ÷ 3: fa -3\".",
      "signature": "",
      "doneWhen": "file src/calculator/operazioni.test.ts"
    },
    {
      "title": "Prepara il file delle operazioni con le sole firme",
      "todo": "Crea `src/calculator/operazioni.ts` con il tipo `Risultato` e le quattro funzioni (ADR-002: funzioni pure, cioè senza React e senza effetti esterni). Per ora ogni funzione restituisce solo `{ ok: false, errore: \"da fare\" }`: così i test trovano le funzioni, partono e falliscono. Il calcolo vero arriva nel passo 3.",
      "signature": "export type Risultato = { ok: true; valore: number } | { ok: false; errore: string };\nexport declare function somma(a: number, b: number): Risultato;\nexport declare function sottrai(a: number, b: number): Risultato;\nexport declare function moltiplica(a: number, b: number): Risultato;\nexport declare function dividi(a: number, b: number): Risultato;",
      "doneWhen": "file src/calculator/operazioni.ts esporta dividi"
    },
    {
      "title": "Esegui i test e leggi i rossi",
      "todo": "Lancia `npx vitest run` dalla cartella del progetto. Controlla che i test partano senza errori di compilazione (nomi sbagliati, import che non trovano il file) e che falliscano solo perché il risultato non è quello atteso. Il test della pagina iniziale deve restare verde.",
      "signature": "",
      "doneWhen": "nessun errore in src/calculator/operazioni.test.ts"
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Fai rileggere i due file di test: controlliamo che coprano tutti i casi del passo e che rispettino ADR-003 (errori come valori) e ADR-004.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Le funzioni di calcolo devono ricevere già dei numeri, oppure il testo scritto nei campi della pagina (per esempio \"abc\" o un campo vuoto)? Dalla risposta dipende dove vanno i test sugli input non validi: qui in calculator o nel passo 4 con la pagina."
}
```
