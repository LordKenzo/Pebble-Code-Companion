```json
{
  "reading": "Questo passo è in gran parte già fatto. Nel passo 2 hai scritto sia i test sia la funzione `calculate` in `src/calculator/calculator.ts`, e i cinque test dei calcoli passano. Quindi il codice è andato un po' avanti rispetto alla roadmap, e seguiamo il codice. La funzione rispetta ADR-002 (è pura, senza React) e ADR-003 (gli errori sono messaggi, non eccezioni). Manca solo una cosa: la riga 4 controlla gli input non validi (`Number.isNaN`, cioè 'non è un numero'), ma nessun test la prova. Mancano anche due casi da verificare: i numeri negativi e i decimali. Propongo solo questi casi in più, e poi la rilettura finale.",
  "tasks": [
    {
      "title": "Aggiungi i test che mancano",
      "todo": "In src/calculator/calculator.test.ts aggiungi questi test, nello stesso stile di quelli che hai già (ADR-003, ADR-004): \"NaN + 2: messaggio Inserisci due numeri\", \"6 ÷ NaN: messaggio Inserisci due numeri\", \"-5 - 3: risultato -8\", \"0,1 + 0,2: circa 0,3\". NaN è il valore che JavaScript usa per 'non è un numero': lo ottieni, per esempio, quando un campo vuoto viene trasformato in numero. Per il caso dei decimali cerca nella documentazione di Vitest l'assertion `toBeCloseTo` (controlla che due numeri siano 'quasi uguali'): ti serve perché 0,1 + 0,2 nel computer non dà esattamente 0,3.",
      "signature": "",
      "doneWhen": "file src/calculator/calculator.test.ts"
    },
    {
      "title": "Fai passare tutti i test dei calcoli",
      "todo": "Esegui `npx vitest run` nel terminale. Se un test nuovo è rosso (cioè fallisce), correggi `calculate` in src/calculator/calculator.ts, ma senza importare React e senza lanciare eccezioni (ADR-002, ADR-003). Alla fine devono essere verdi anche i cinque test vecchi e il test \"Pagina iniziale\".",
      "signature": "export function calculate(a: number, b: number, op: Operation): number | string",
      "doneWhen": "test \"NaN + 2\" \"6 ÷ NaN\" \"-5 - 3\" \"0,1 + 0,2\""
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Chiedi una revisione di src/calculator/calculator.ts e del suo file di test. Controlliamo che tutti i casi di errore previsti da ADR-003 siano coperti prima di passare alla pagina.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Quando il risultato ha molti decimali (per esempio 10 ÷ 3), vuoi che `calculate` lo arrotondi, e a quante cifre, oppure che lo restituisca così com'è e lasci alla pagina il compito di mostrarlo arrotondato?"
}
```
