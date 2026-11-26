```json
{
  "reading": "Il bug nasce in `calculate` (src/calculator/calculator.ts, riga 6): `a + b` restituisce il risultato grezzo dei numeri in virgola mobile. JavaScript salva 0.1 e 0.2 in binario e non riesce a rappresentarli in modo esatto, quindi la somma esce come 0.30000000000000004. Lo stesso succede con sottrazione e moltiplicazione, per esempio 0.3 - 0.1 e 0.1 × 3. I test attuali usano solo numeri interi, per questo non l'hanno mai visto. Secondo ADR-002 la correzione va nella funzione pura in `src/calculator/`, non nel componente. C'è anche una seconda parte nel titolo del bug: la virgola al posto del punto (0,3 invece di 0.3). Quella riguarda come la pagina mostra il numero, non il calcolo.",
  "tasks": [
    {
      "title": "Scrivi il test che riproduce il bug",
      "todo": "Aggiungi in src/calculator/calculator.test.ts il test \"add: 0,1 + 0,2 = 0,3\", che si aspetta `0.3` da `calculate(0.1, 0.2, 'add')`. Eseguilo e controlla che fallisca con il codice di adesso: se passa, non sta riproducendo il bug (ADR-004).",
      "signature": "",
      "doneWhen": "file src/calculator/calculator.test.ts"
    },
    {
      "title": "Arrotonda il risultato in calculator",
      "todo": "Aggiungi in src/calculator/calculator.ts una funzione pura che riporta il risultato a un numero ragionevole di decimali, e usala in `calculate` prima di restituire un numero. I messaggi d'errore restano stringhe (ADR-002, ADR-003). Per approfondire cerca \"floating point\" nella guida MDN su `Number`.",
      "signature": "function roundResult(value: number): number",
      "doneWhen": "test \"add: 0,1 + 0,2 = 0,3\" \"add: 2 + 2 = 4\" \"divide: 7 ÷ 0 = error message\""
    },
    {
      "title": "Copri i casi vicini con altri test",
      "todo": "Aggiungi i test \"subtract: 0,3 - 0,1 = 0,2\", \"multiply: 0,1 × 3 = 0,3\" e \"divide: 1 ÷ 3 = 0,3333333333\", così controlli che l'arrotondamento non tagli troppo. Fissa nell'ultimo test il numero di decimali che hai scelto (ADR-004).",
      "signature": "",
      "doneWhen": "test \"subtract: 0,3 - 0,1 = 0,2\" \"multiply: 0,1 × 3 = 0,3\" \"divide: 1 ÷ 3 = 0,3333333333\""
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Rileggiamo insieme la correzione e i nuovi test.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Mostrare il risultato con la virgola (0,3 invece di 0.3) fa parte di questo bug? Se sì, aggiungo un task per una funzione di formattazione in calculator."
}
```
