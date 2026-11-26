```json
{
  "lines": [
    {
      "where": "12",
      "text": "Scorre `PLATES` nell'ordine in cui è dichiarato alla riga 5, dal più pesante (25_000) al più leggero (1_250). L'algoritmo dipende da questo ordine: se l'array non fosse decrescente, il risultato cambierebbe."
    },
    {
      "where": "13-16",
      "text": "Per ogni taglio, finché il residuo `remaining` (grammi per lato) è almeno pari al disco, aggiunge quel disco a `perSide` e lo sottrae dal residuo. Un `while` dentro il `for` permette più dischi dello stesso taglio. È coerente con ADR-004, che considera i dischi illimitati per taglio."
    },
    {
      "where": "17",
      "text": "Chiude il ciclo esterno. Alla fine `perSide` contiene i dischi di un lato, già in ordine decrescente. Nell'esempio di 142,5 kg (142_500 g), la riga 10 dà remaining = 61_250. Il ciclo prende 25_000 due volte (resta 11_250), salta 20_000 e 15_000, prende 10_000 (resta 1_250), salta 5_000 e 2_500, prende 1_250 (resta 0). Risultato: [25_000, 25_000, 10_000, 1_250]. Con un totale sotto `BAR`, `remaining` è negativo, il `while` non scatta mai e `perSide` resta vuoto. Con un totale non componibile, il residuo che avanza viene ignorato in silenzio."
    }
  ],
  "summary": "È l'algoritmo greedy del resto in monete: a ogni passo prende il disco più grande che entra nel residuo. Con questi tagli e scorte illimitate, il greedy restituisce anche il numero minimo di dischi. Il motivo è che ogni taglio è componibile esattamente con quelli più piccoli: 25 = 20 + 5 e 15 = 10 + 5, quindi scegliere il disco grande non toglie mai una soluzione migliore. Il costo è O(numero di dischi), trascurabile sotto i 999 kg previsti da ADR-004. Con un inventario finito, o con tagli non canonici, il greedy non basterebbe più e servirebbe un approccio di programmazione dinamica o di backtracking."
}
```
