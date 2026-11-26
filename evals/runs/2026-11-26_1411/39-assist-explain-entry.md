```json
{
  "lines": [
    {
      "where": "12",
      "text": "`for (const plate of PLATES)` è un ciclo, cioè un pezzo di codice che si ripete. Prende uno alla volta i dischi della lista `PLATES` (riga 5), nell'ordine in cui sono scritti: prima 25_000 (25 kg), poi 20_000, 15_000, 10_000, 5_000, 2_500 e infine 1_250 (1,25 kg). A ogni giro il disco del momento si chiama `plate`. I numeri sono in grammi interi, come chiede ADR-003. Il trattino basso in 25_000 serve solo a leggerli meglio."
    },
    {
      "where": "13",
      "text": "`while (remaining >= plate)` è un secondo ciclo, dentro il primo. Ripete il suo blocco finché la condizione è vera, cioè finché il peso che manca su un lato (`remaining`, calcolato alla riga 10) è grande almeno quanto il disco del momento. Se il disco è troppo pesante, il blocco non parte nemmeno e si passa al disco successivo, più leggero."
    },
    {
      "where": "14",
      "text": "`perSide.push(plate)` aggiunge il disco in fondo alla lista `perSide`, che all'inizio è vuota (riga 11). Questa lista conterrà i dischi da montare su un lato."
    },
    {
      "where": "15",
      "text": "`remaining -= plate` è un modo breve per scrivere `remaining = remaining - plate`: toglie dal peso che manca il disco appena messo. Poi il `while` ricontrolla la condizione con il nuovo valore."
    },
    {
      "where": "16-17",
      "text": "La prima graffa chiude il `while`, la seconda chiude il `for`. Quando il `while` finisce, il `for` passa al disco successivo. Quando i dischi della lista sono finiti, si esce e la riga 18 restituisce il risultato."
    },
    {
      "where": "traccia con 142,5 kg",
      "text": "Con `total` = 142_500 grammi, la riga 10 calcola remaining = (142_500 − 20_000) / 2 = 61_250. Ecco i giri:\n- Disco 25_000: 61_250 ≥ 25_000, quindi metto il disco e remaining scende a 36_250. Ancora ≥ 25_000, metto il secondo e remaining scende a 11_250. Ora è minore di 25_000 e passo oltre.\n- Dischi 20_000 e 15_000: 11_250 è minore di entrambi, quindi non entrano.\n- Disco 10_000: 11_250 ≥ 10_000, metto il disco e remaining scende a 1_250.\n- Dischi 5_000 e 2_500: troppo pesanti, non entrano.\n- Disco 1_250: 1_250 ≥ 1_250, metto il disco e remaining scende a 0.\n\nAlla fine `perSide` = [25_000, 25_000, 10_000, 1_250], cioè 25 + 25 + 10 + 1,25 kg per lato."
    }
  ],
  "summary": "L'idea è riempire un lato del bilanciere partendo dal disco più pesante. Per ogni disco, dal più grande al più piccolo, ne metti quanti ne entrano nel peso che manca, poi passi a quello più leggero. Funziona perché la lista `PLATES` è ordinata dal più pesante al più leggero: se cambi l'ordine, cambia il risultato. Questo modo di risolvere un problema si chiama algoritmo «greedy» (avido): a ogni passo prendi la scelta più grande possibile. È lo stesso metodo con cui un cassiere dà il resto usando prima le monete più grandi. Il fatto che i dischi siano illimitati (ADR-004) è ciò che permette al `while` di prendere lo stesso disco più volte. Per approfondire, sul sito MDN (developer.mozilla.org) cerca le pagine «for...of» e «while» nella sezione JavaScript › Reference › Statements. Domanda per verificare: con 60 kg totali, cosa contiene `perSide` alla fine?"
}
```
