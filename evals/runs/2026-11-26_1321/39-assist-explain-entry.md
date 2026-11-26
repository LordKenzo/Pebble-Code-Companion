```json
{
  "lines": [
    {
      "where": "riga 12",
      "text": "`for (const plate of PLATES)` è un ciclo, cioè un blocco di codice che si ripete. Qui si ripete una volta per ogni disco della lista `PLATES` (riga 5), nell'ordine in cui sono scritti: dal più pesante (25_000 grammi, cioè 25 kg) al più leggero (1_250 grammi). A ogni giro, `plate` è il disco che stiamo considerando in quel momento."
    },
    {
      "where": "riga 13",
      "text": "`while (remaining >= plate)` è un secondo ciclo, dentro il primo. Si ripete finché la condizione è vera: «il peso che manca ancora da mettere su un lato (`remaining`) è almeno quanto pesa questo disco?». Se sì, il disco ci sta e si entra nel blocco. Se no, si passa al disco successivo, più leggero."
    },
    {
      "where": "righe 14-15",
      "text": "Quando il disco ci sta, succedono due cose. `perSide.push(plate)` aggiunge il disco in fondo alla lista dei dischi da caricare su un lato. `remaining -= plate` toglie il suo peso da quello che manca (è un modo breve di scrivere `remaining = remaining - plate`). Poi si torna alla riga 13 e si controlla di nuovo lo stesso disco: magari ne serve un secondo uguale."
    },
    {
      "where": "righe 16-17",
      "text": "Le due parentesi graffe chiudono i due cicli: prima quello del `while`, poi quello del `for`. Quando il `for` ha provato tutti i dischi, `perSide` contiene la lista completa per un lato e si passa alla riga 18."
    },
    {
      "where": "traccia con 142,5 kg",
      "text": "Con `total` = 142_500 g, la riga 10 dà `remaining` = (142_500 − 20_000) / 2 = 61_250 g per lato. Disco 25_000: ci sta, quindi `remaining` diventa 36_250. Ci sta ancora, quindi diventa 11_250. Ora non ci sta più. Disco 20_000: no. Disco 15_000: no. Disco 10_000: sì, `remaining` scende a 1_250. Disco 5_000: no. Disco 2_500: no. Disco 1_250: sì, `remaining` arriva a 0. Risultato: `perSide` = [25_000, 25_000, 10_000, 1_250], cioè 61,25 kg per lato."
    }
  ],
  "summary": "L'idea è quella che useresti a mano davanti alla rastrelliera: prendi sempre il disco più pesante che ci sta ancora, e quando non ci sta più passi a quello più piccolo. Questo modo di procedere si chiama «algoritmo goloso» (in inglese greedy): a ogni passo fa la scelta che sembra migliore in quel momento, senza ripensarci. Funziona perché i dischi sono considerati illimitati per taglio (ADR-004), quindi il ciclo non deve mai controllare quanti dischi di un tipo restano disponibili."
}
```
