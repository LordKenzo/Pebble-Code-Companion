{
  "reading": "Il bug nasce probabilmente da come JavaScript rappresenta i decimali: in binario 0,1 e 0,2 sono approssimati, e `calculate` restituisce il risultato così com'è (riga 6, `case 'add'`). Anche sottrazione, moltiplicazione e divisione possono avere lo stesso problema. La correzione va in `src/calculator/`, non nei componenti (ADR-002). I test attuali usano numeri interi (o divisioni esatte), quindi non lo intercettano.",
  "tasks": [
    {
      "title": "Scrivi il test che riproduce il bug",
      "todo": "In `src/calculator/calculator.test.ts` aggiungi il test \"0,1 + 0,2: mostra 0,3\" con un confronto esatto (`toBe`), perché un confronto approssimato nasconderebbe il bug (ADR-004). Eseguilo sul codice attuale: deve fallire mostrando 0.30000000000000004.",
      "signature": "",
      "doneWhen": "a mano"
    },
    {
      "title": "Correggi la precisione del risultato",
      "todo": "In `src/calculator/calculator.ts` arrotonda i risultati numerici a una precisione scelta, in un'unica funzione pura usata da `calculate` (ADR-002). I messaggi d'errore restano invariati (ADR-003) e i test già presenti devono continuare a passare.",
      "signature": "function roundResult(value: number): number",
      "doneWhen": "test \"0,1 + 0,2\""
    },
    {
      "title": "Copri i casi limite vicini",
      "todo": "Aggiungi i test \"0,3 - 0,1: mostra 0,2\", \"0,1 × 3: mostra 0,3\", \"0,3 ÷ 0,1: mostra 3\" e \"0,0000001 × 0,0000001: non diventa 0\". L'ultimo controlla che l'arrotondamento non cancelli i numeri molto piccoli: se qualcuno fallisce, correggi la funzione di arrotondamento.",
      "signature": "",
      "doneWhen": "test \"0,3 - 0,1\" \"0,1 × 3\" \"0,3 ÷ 0,1\" \"0,0000001 × 0,0000001\""
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Chiedi una revisione di `calculator.ts` e dei suoi test, controllando che la precisione scelta sia chiara a chi legge il codice.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "La calcolatrice deve gestire numeri con molte cifre (per esempio oltre 12 cifre significative) senza arrotondarli?"
}
