```json
{
  "tips": [
    {
      "where": "righe 9-10, 18",
      "title": "Sotto i 20 kg serve l'esito «solo bilanciere» con avviso",
      "body": "Con 15 kg `remaining` vale (15_000 − 20_000) / 2 = −2_500. Il `for` non aggiunge nulla e la funzione restituisce `ok` con `perSide` vuoto e `total: 15_000`, senza nessun avviso: è il test rosso «15 kg». In palestra quel valore è fuorviante, perché sul bilanciere ci sono comunque 20 kg. Prova così: prima del ciclo, se `total < BAR`, restituisci subito l'esito «ok con avviso» di `result.ts`, con `perSide` vuoto e il carico reale pari a `BAR`.",
      "anchor": "ADR-004"
    },
    {
      "where": "righe 15-18",
      "title": "Il resto dopo il ciclo viene scartato in silenzio",
      "body": "Con 61 kg per lato servono 20_500 g. Il ciclo mette un disco da 20_000 e lascia `remaining = 500`, poi restituisce `ok` con `total: 61_000`. Il carico reale però è 60 kg, e né il test né chi legge l'output vedono la differenza: è il test rosso «61 kg». Prova così: dopo il ciclo, se `remaining > 0`, restituisci l'esito con avviso e il totale effettivo (BAR + 2 × somma di `perSide`), distinto da quello richiesto.",
      "anchor": "ADR-003"
    },
    {
      "where": "riga 10",
      "title": "La divisione può produrre grammi non interi e l'input non è validato",
      "body": "Con un `total` dispari, ad esempio 61_001, `remaining` diventa 20_500,5 e rompe l'invariante «solo grammi interi». Allo stesso modo, un `total` ≤ 0 o `NaN` passa senza errore. Prova così: all'inizio di `platesFor` restituisci l'esito non valido se `total` non è un intero positivo. Aggiungi due casi di test: 0 g deve dare un errore, e 61_001 g deve dare un avviso con un carico reale intero.",
      "anchor": "ADR-004"
    }
  ]
}
```
