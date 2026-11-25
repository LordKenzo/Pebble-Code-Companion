```json
{
  "lines": [
    {
      "where": "riga 12",
      "text": "Scorre `PLATES` nell'ordine in cui è dichiarato a riga 5, dal disco più pesante (25.000 g) al più leggero (1.250 g). Il risultato dipende da questo ordine: con l'array in ordine crescente riempiresti il lato di dischi da 1,25."
    },
    {
      "where": "righe 13-16",
      "text": "Per ogni taglio aggiunge lo stesso disco finché ci sta nel residuo per lato (`remaining >= plate`): lo mette in `perSide` e lo sottrae da `remaining`. Non c'è limite sul numero di dischi per taglio, coerente con l'inventario illimitato di ADR-004."
    },
    {
      "where": "riga 17",
      "text": "Chiusi tutti i tagli, `remaining` contiene quello che nessun disco riesce a coprire. Con un totale componibile vale 0. Con un totale non componibile resta un residuo positivo, che il ciclo non segnala. Con un totale sotto i 20 kg `remaining` è già negativo, quindi il `while` non entra mai e `perSide` resta vuoto."
    }
  ],
  "summary": "È un algoritmo greedy: a ogni passo prende il disco più grande che ci sta. Con i tagli europei standard e dischi illimitati dà sempre la scomposizione con meno dischi, quindi qui non serve la programmazione dinamica, che diventerebbe necessaria con un inventario finito. Esempio con 142,5 kg: `remaining` = (142.500 − 20.000) / 2 = 61.250 g. Il 25.000 entra due volte (resta 11.250). Il 20.000 e il 15.000 vengono saltati. Il 10.000 entra una volta (resta 1.250). Il 5.000 e il 2.500 vengono saltati. Il 1.250 entra una volta (resta 0). Per lato quindi: [25.000, 25.000, 10.000, 1.250]. Con 60 kg: `remaining` = 20.000 g, il 25.000 non entra, il 20.000 sì, e il lato è [20.000]. Il costo è O(tagli + dischi), trascurabile sotto i 999 kg."
}
```
