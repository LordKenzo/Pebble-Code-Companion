```json
{
  "reading": "Questo passo è in gran parte già fatto. Nel passo 2 hai scritto sia i test sia la funzione `calculate` in `src/calculator/calculator.ts`, e i cinque test delle operazioni risultano già verdi nel percorso. Le operazioni sono funzioni pure, cioè funzioni che ricevono dei numeri e restituiscono un risultato senza toccare la pagina, come chiede ADR-002. La divisione per zero restituisce un messaggio invece di bloccare il programma, come chiede ADR-003. Manca però una cosa: la riga 4 gestisce gli input non validi (`NaN`, cioè «non è un numero»), ma nessun test la controlla. Un test è un piccolo programma che verifica che il tuo codice faccia quello che ti aspetti. Senza test, se un giorno quella riga si rompe, non te ne accorgi. Ti propongo quindi solo i casi che mancano, poi la rilettura finale.",
  "tasks": [
    {
      "title": "Aggiungi i test che mancano",
      "todo": "In src/calculator/calculator.test.ts aggiungi questi casi, uno per riga, come quelli che hai già: \"NaN + 2: messaggio d'errore\", \"5 × NaN: messaggio d'errore\", \"1 ÷ 4: risultato decimale 0.25\". I primi due controllano gli input non validi (ADR-003), il terzo una divisione che non dà un numero intero (ADR-004). Per creare un valore «non numero» in un test puoi usare `Number.NaN`.",
      "signature": "",
      "doneWhen": "file src/calculator/calculator.test.ts"
    },
    {
      "title": "Fai passare i nuovi test",
      "todo": "Lancia i test con `npx vitest run`. Se un test diventa rosso, leggi il messaggio, che dice cosa si aspettava e cosa ha ricevuto, e correggi `calculate` in src/calculator/calculator.ts. Non cambiare il nome né la forma della funzione: la pagina del passo 4 la userà così (ADR-002).",
      "signature": "export function calculate(a: number, b: number, op: Operation): number | string",
      "doneWhen": "test \"NaN + 2\" \"5 × NaN\" \"1 ÷ 4\""
    },
    {
      "title": "Controlla che tutti i test dei calcoli siano verdi",
      "todo": "Lancia di nuovo `npx vitest run` e verifica che passino sia i cinque test vecchi sia i tre nuovi, e che l'editor non segnali errori nel file della funzione. È la condizione di fine del passo 3 nella roadmap (ADR-004).",
      "signature": "",
      "doneWhen": "nessun errore in src/calculator/calculator.ts"
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Rileggiamo insieme calculator.ts e calculator.test.ts prima di passare alla pagina.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": ""
}
```
