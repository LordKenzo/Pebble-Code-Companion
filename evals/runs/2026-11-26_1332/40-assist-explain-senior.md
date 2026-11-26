```json
{
  "lines": [
    {
      "where": "12",
      "text": "Scorre `PLATES` nell'ordine dichiarato, dal più pesante (25 000 g) al più leggero (1 250 g). L'algoritmo è greedy e dipende da quell'ordine: se l'array venisse riordinato, il risultato cambierebbe."
    },
    {
      "where": "13-16",
      "text": "Per ogni taglio continua a prendere dischi finché ci stanno nel `remaining` per lato: aggiunge il disco a `perSide` e lo sottrae. Lo stesso taglio può quindi comparire più volte, per esempio due da 25. Questo è coerente con i dischi illimitati di ADR-004."
    },
    {
      "where": "17",
      "text": "Si passa al taglio successivo solo quando quello corrente non ci sta più. Alla fine del ciclo `perSide` è ordinato in modo decrescente. Il valore finale di `remaining` viene scartato: non viene né controllato né restituito."
    }
  ],
  "summary": "È il resto in monete applicato ai dischi. Con la serie 25/20/15/10/5/2,5/1,25 e scorte illimitate, la scelta greedy dà sempre il numero minimo di dischi. Esempio con 142,5 kg: `remaining` vale 61 250 g. Si prendono 25 000 (resta 36 250), poi 25 000 (resta 11 250); 20 000 e 15 000 non ci stanno; si prende 10 000 (resta 1 250); 5 000 e 2 500 non ci stanno; si prende 1 250 (resta 0). Il risultato è [25 000, 25 000, 10 000, 1 250]. Il ciclo dà per scontato che `remaining` sia un multiplo di 1 250. Se non lo è, il resto avanza in silenzio. Sotto i 20 kg `remaining` è negativo, nessun `while` entra e `perSide` resta vuoto."
}
```
