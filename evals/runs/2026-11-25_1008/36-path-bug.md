```json
{
  "reading": "Il bug nasce in src/calculator/calculator.ts, riga 6: `a + b` restituisce il risultato così come lo produce l'aritmetica in virgola mobile (floating point, standard IEEE 754). In binario 0,1 e 0,2 non si rappresentano in modo esatto, e nessuno arrotonda prima che il valore arrivi alla pagina. Lo stesso succede in tutte e quattro le operazioni (righe 6-9), non solo nella somma. I test attuali non lo vedono perché usano solo numeri interi. Il percorso resta dentro calculator, come chiede ADR-002, e non tocca il resto.",
  "tasks": [
    {
      "title": "Riproduci il bug con un test",
      "todo": "In src/calculator/calculator.test.ts aggiungi il test \"add: 0,1 + 0,2 = 0,3\" e confronta il risultato in modo esatto con 0.3. Il test deve fallire con il codice di oggi e mostrare 0.30000000000000004 come valore ricevuto. Se passa subito, non riproduce il bug (ADR-004).",
      "signature": "",
      "doneWhen": "nessun errore in src/calculator/calculator.test.ts"
    },
    {
      "title": "Correggi il risultato in calculator",
      "todo": "Fai in modo che calculate restituisca 0,3 per 0,1 + 0,2, con una regola valida per tutte le operazioni e non solo per la somma. La correzione resta nella funzione pura, senza React (ADR-002). I messaggi d'errore restano stringhe, come vuole ADR-003, e i cinque test esistenti devono continuare a passare. Cerca \"floating point precision JavaScript\" su MDN, alla voce Number.EPSILON, per capire perché succede.",
      "signature": "export function calculate(a: number, b: number, op: Operation): number | string",
      "doneWhen": "test \"add: 0,1 + 0,2 = 0,3\""
    },
    {
      "title": "Copri i casi vicini",
      "todo": "Aggiungi i test \"multiply: 0,1 × 3 = 0,3\" e \"subtract: 0,3 - 0,1 = 0,2\": sono lo stesso problema in altre operazioni. Aggiungi anche \"divide: 1 ÷ 3 = 0,3333333333\", che verifica che la tua regola non tagli troppe cifre a un risultato periodico. Prima di scriverlo decidi quante cifre deve avere quel risultato.",
      "signature": "",
      "doneWhen": "test \"multiply: 0,1 × 3 = 0,3\" \"subtract: 0,3 - 0,1 = 0,2\" \"divide: 1 ÷ 3 = 0,3333333333\""
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Fai rileggere calculator.ts e i nuovi test. Verifica che la regola di arrotondamento sia una sola, che abbia un nome chiaro e che non abbia rotto ADR-003.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Il risultato deve restare arrotondato anche quando calculate viene usata fuori dalla pagina, oppure il numero grezzo va bene e serve solo mostrarlo bene a schermo? Nel primo caso la correzione sta in calculator, nel secondo nella formattazione dell'interfaccia, e il test del primo task cambia di conseguenza."
}
```
