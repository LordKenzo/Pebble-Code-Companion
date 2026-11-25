```json
{
  "reading": "Il passo 3 è in gran parte già fatto. Nel passo 2 hai scritto sia i test sia la funzione `calculate` in `src/calculator/calculator.ts`, e i cinque test risultano verdi nel percorso. La funzione è pura (non usa React), come chiede ADR-002, e restituisce i messaggi d'errore invece di lanciarli, come chiede ADR-003. Resta scoperto un caso solo: la riga 4 controlla gli input non validi (`NaN`, cioè «non è un numero»: quello che ottieni quando un campo vuoto o con lettere diventa numero), ma nessun test lo verifica. Mancano anche due casi di confine: 0 ÷ 0 e i numeri negativi. Propongo solo questi, più la rilettura finale.",
  "tasks": [
    {
      "title": "Aggiungi i test dei casi mancanti",
      "todo": "In src/calculator/calculator.test.ts aggiungi questi test, uno per riga come gli altri: \"NaN + 2: messaggio Inserisci due numeri\", \"2 + NaN: messaggio Inserisci due numeri\", \"0 ÷ 0: messaggio di divisione per zero\", \"-6 ÷ 3: -2\". I primi due coprono gli input non validi di ADR-003. Per creare un NaN nel test puoi usare `Number.NaN`. Lancia `npx vitest run`: questi test dovrebbero passare subito, perché la logica c'è già. Se uno è rosso, hai trovato un caso che la funzione non gestisce.",
      "signature": "export function calculate(a: number, b: number, op: Operation): number | string",
      "doneWhen": "test \"NaN + 2\" \"2 + NaN\" \"0 ÷ 0\" \"-6 ÷ 3\""
    },
    {
      "title": "Fai passare tutti i test dei calcoli",
      "todo": "Esegui tutta la suite dei calcoli con `npx vitest run src/calculator`. Se un test nuovo è rosso, correggi `calculate` in calculator.ts senza toccare i test. La funzione resta pura e restituisce i messaggi d'errore senza lanciarli (ADR-002, ADR-003).",
      "signature": "",
      "doneWhen": "test \"add\" \"subtract\" \"multiply\" \"divide\" \"NaN + 2\" \"2 + NaN\" \"0 ÷ 0\" \"-6 ÷ 3\""
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Apri calculator.ts e calculator.test.ts e chiedi una revisione. Controlliamo insieme che i messaggi d'errore siano coerenti tra loro e che ogni ramo della funzione abbia almeno un test (ADR-004).",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Quanto deve mostrare la calcolatrice per 0,1 + 0,2? Il computer conserva i decimali in modo approssimato e il risultato esatto è 0,30000000000000004. Vuoi che `calculate` restituisca il numero così com'è e che sia la pagina ad arrotondarlo, oppure che lo arrotondi già la funzione?"
}
```
