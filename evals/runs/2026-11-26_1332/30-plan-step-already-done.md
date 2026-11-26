```json
{
  "reading": "Buona notizia: il passo 3 è già quasi tutto fatto. Nel passo 2 hai scritto la funzione `calculate` in `src/calculator/calculator.ts` e i cinque test delle operazioni passano. Una funzione pura è una funzione che, dati gli stessi numeri, restituisce sempre lo stesso risultato e non usa React. `calculate` è proprio così, quindi rispetta ADR-002. Gli errori vengono restituiti come messaggi e non lanciati, come chiede ADR-003. Manca una cosa sola: la riga 4 gestisce l'input non valido (`NaN`, cioè \"non è un numero\", quello che ottieni se un campo è vuoto o contiene lettere), ma nessun test la controlla. Il passo 4 dipende da questo caso, perché i campi della pagina possono restare vuoti. Ti propongo quindi solo i test che mancano, una verifica e la revisione finale.",
  "tasks": [
    {
      "title": "Aggiungi i test dei casi limite",
      "todo": "In src/calculator/calculator.test.ts, sotto i test che ci sono già, aggiungi questi casi (ADR-003, ADR-004): \"input non valido: NaN + 2 = messaggio d'errore\" (deve restituire 'Inserisci due numeri'), \"sottrazione negativa: 3 - 5 = -2\", \"divisione con decimali: 7 ÷ 2 = 3.5\". Ogni test chiama `calculate` con quei numeri e controlla il risultato con `expect(...).toBe(...)`, come quelli già scritti.",
      "signature": "",
      "doneWhen": "test \"input non valido\" \"sottrazione negativa\" \"divisione con decimali\""
    },
    {
      "title": "Esegui tutti i test e controlla gli errori",
      "todo": "Nel terminale lancia `npx vitest run` e controlla che tutti i test di calculator siano verdi, i vecchi e i nuovi. Poi guarda nell'editor che calculator.ts non mostri errori rossi di TypeScript (ADR-001, ADR-004). Se un test nuovo è rosso, leggi cosa si aspettava e cosa ha ricevuto: ti dice dove guardare.",
      "signature": "",
      "doneWhen": "nessun errore in src/calculator/calculator.ts"
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Rivediamo insieme calculator.ts e calculator.test.ts prima di passare alla pagina (ADR-002, ADR-003).",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": ""
}
```
