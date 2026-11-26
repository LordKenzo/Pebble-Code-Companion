```json
{
  "tips": [
    {
      "where": "righe 10 e 18",
      "title": "Sotto i 20 kg non esce l'esito «solo bilanciere»",
      "body": "Con 15 kg (15_000) la riga 10 dà remaining = -2_500. Il ciclo non aggiunge dischi e la riga 18 restituisce sempre `ok` con perSide vuoto, senza avviso. Per questo il test «15 kg: solo bilanciere, con avviso» è rosso. Prima del calcolo serve un controllo su total rispetto a BAR che restituisca l'esito con avviso previsto da result.ts. Oggi importi solo `ok`: guarda quali altri costruttori esporta.",
      "anchor": "ADR-004"
    },
    {
      "where": "righe 17-18",
      "title": "Il resto dopo il ciclo viene ignorato",
      "body": "Con 61 kg, remaining parte da 20_500. Dopo il disco da 20_000 restano 500 g che nessun disco copre, ma la riga 18 risponde comunque `ok`. Il carico mostrato non corrisponde a quello reale e nessuno se ne accorge. Il test «61 kg: avviso sul resto» lo segnala. Dopo il ciclo guarda quanto vale remaining: se non è zero, l'esito deve essere un ok con avviso, e deve dire quanto manca.",
      "anchor": "ADR-004"
    },
    {
      "where": "righe 21-23",
      "title": "loadsFor non ha un tipo di ritorno ed è fuori dal passo",
      "body": "Il tipo di ritorno di loadsFor, implicito, oggi è `void`. Quando lo implementerai, tsc non controllerà la forma del risultato (target, carico reale, dischi), che ADR-003 vuole tutti visibili. La funzione appartiene al passo 4 della roadmap: per ora puoi toglierla. Se la tieni, dichiara subito il tipo di ritorno `Result<…>` e i parametri `readonly`, così `tsc --noEmit` ti guida.",
      "anchor": "roadmap › passo 4"
    }
  ]
}
```
