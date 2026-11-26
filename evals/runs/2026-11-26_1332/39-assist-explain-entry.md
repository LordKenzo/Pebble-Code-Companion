```json
{
  "lines": [
    {
      "where": "12",
      "text": "`for (const plate of PLATES)` è un ciclo, cioè un blocco di codice che si ripete. Qui si ripete una volta per ogni disco della lista `PLATES` (riga 5), in ordine dal più pesante al più leggero: 25.000, 20.000, 15.000, 10.000, 5.000, 2.500, 1.250 grammi. A ogni giro, `plate` contiene il disco di quel momento. L'ordine conta: si provano sempre prima i dischi grandi."
    },
    {
      "where": "13",
      "text": "`while (remaining >= plate)` è un secondo ciclo, dentro il primo. Continua a ripetersi finché il peso che manca su un lato (`remaining`, calcolato alla riga 10) è almeno quanto il disco attuale. In pratica la domanda è: «questo disco ci sta ancora?». Finché la risposta è sì, si resta su questo disco. Quando è no, il `for` passa al disco successivo, più piccolo."
    },
    {
      "where": "14-15",
      "text": "Ogni volta che il disco ci sta succedono due cose. `perSide.push(plate)` aggiunge il disco in fondo alla lista `perSide`, che è un array, cioè una lista di valori in ordine: sono i dischi da montare su un lato. Poi `remaining -= plate` toglie il peso del disco da quello che manca. È un modo breve di scrivere `remaining = remaining - plate`."
    },
    {
      "where": "16-17",
      "text": "Le due parentesi graffe chiudono i due cicli: la riga 16 chiude il `while`, la riga 17 chiude il `for`. Quando il `for` ha provato tutti e sette i dischi, si va avanti alla riga 18, che restituisce il risultato."
    }
  ],
  "summary": "L'idea: su ogni lato metti il disco più grande che ci sta e ripeti finché puoi; quando non ci sta più, passi al disco più piccolo. È lo stesso metodo che usi per dare il resto con le monete. Un esempio con 142,5 kg (142.500 g): la riga 10 dà `remaining` = (142.500 − 20.000) / 2 = 61.250 g per lato. Il disco da 25.000 ci sta due volte, quindi restano 61.250 → 36.250 → 11.250. Il 20.000 e il 15.000 non ci stanno. Il 10.000 ci sta una volta, quindi restano 1.250. Il 5.000 e il 2.500 non ci stanno. L'1.250 ci sta una volta, quindi resta 0. Il risultato è `perSide` = [25.000, 25.000, 10.000, 1.250], cioè 25 + 25 + 10 + 1,25 kg per lato. Prova tu: quali dischi escono con 60 kg?"
}
```
