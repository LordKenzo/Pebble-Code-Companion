```json
{
  "lines": [
    {
      "where": "12",
      "text": "Scorre `PLATES` nell'ordine dichiarato, dal 25 kg al 1,25 kg. L'algoritmo dipende da quest'ordine decrescente: se riordini l'array, il risultato cambia."
    },
    {
      "where": "13-16",
      "text": "Algoritmo greedy. Finché il residuo per lato copre il disco corrente, lo aggiunge a `perSide` e lo sottrae da `remaining`. Poi passa al taglio successivo. Non c'è un limite sul numero di dischi per taglio, coerente con l'inventario illimitato di ADR-004. Con questo set (multipli di 1,25: 20, 16, 12, 8, 4, 2, 1) la scelta greedy dà anche il numero minimo di dischi. Traccia su 142,5 kg: `remaining` = 61_250. Due dischi da 25_000 portano il residuo a 11_250. Il 20, il 15 e il 10 kg: il 10_000 entra e lascia 1_250. Il 5 e il 2,5 kg non entrano. Il 1_250 entra e azzera il residuo. Risultato: [25_000, 25_000, 10_000, 1_250]."
    },
    {
      "where": "17",
      "text": "Il ciclo esce con `remaining` ≥ 0 e minore di 1_250. Quel valore non viene letto. Se il carico non è componibile, per esempio 61_300 g per lato, i 50 g avanzati spariscono e `total` resta quello in ingresso. Sotto i 20 kg `remaining` è negativo: nessun `while` entra e `perSide` resta vuoto."
    }
  ],
  "summary": "Scomposizione greedy del carico di un lato nei tagli disponibili, dal più pesante al più leggero. È corretta e minima per questo set di dischi e con inventario illimitato. Presuppone che l'ingresso sia già componibile: il residuo finale non viene controllato. Se si scartano 50 g o si accetta un carico sotto il bilanciere lo decide il chiamante, oppure un controllo esplicito, non questo ciclo."
}
```
