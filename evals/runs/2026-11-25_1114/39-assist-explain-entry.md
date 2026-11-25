```json
{
  "lines": [
    {
      "where": "riga 12",
      "text": "`for (const plate of PLATES)` è un ciclo, cioè un blocco di istruzioni ripetuto più volte. Qui prende uno alla volta i dischi della lista `PLATES` (riga 5), nell'ordine in cui sono scritti: prima 25_000 grammi (25 kg), poi 20_000, poi 15_000 e così via fino a 1_250 (1,25 kg). A ogni giro il disco di turno si chiama `plate`. L'ordine conta: si parte dal disco più pesante."
    },
    {
      "where": "riga 13",
      "text": "`while (remaining >= plate)` è un secondo ciclo, dentro il primo. Si ripete finché la condizione tra parentesi è vera, cioè finché il peso che resta da caricare su un lato (`remaining`, calcolato alla riga 10) è almeno quanto il disco di turno. Se il disco è troppo pesante, il ciclo non parte nemmeno e si passa al disco successivo."
    },
    {
      "where": "righe 14-15",
      "text": "Sono le due istruzioni ripetute dal `while`. `perSide.push(plate)` aggiunge il disco in fondo alla lista `perSide`, cioè la lista dei dischi da mettere su un lato. `remaining -= plate` toglie il peso di quel disco da quello che resta da caricare: è una forma breve di «remaining = remaining − plate»."
    },
    {
      "where": "righe 16-17",
      "text": "Le due parentesi graffe chiudono i cicli. La prima chiude il `while`: quando il disco non ci sta più, si torna al `for`. La seconda chiude il `for`: quando la lista `PLATES` è finita, si esce e si arriva al `return` della riga 18."
    },
    {
      "where": "esempio con 142,5 kg",
      "text": "`total` = 142_500 g. La riga 10 dà `remaining` = (142_500 − 20_000) / 2 = 61_250 g per lato. Disco 25_000: ci sta, quindi si aggiunge e restano 36_250. Ci sta ancora: si aggiunge e restano 11_250. Ora 25_000 non ci sta più. Dischi 20_000 e 15_000: non ci stanno. Disco 10_000: ci sta, restano 1_250. Dischi 5_000 e 2_500: non ci stanno. Disco 1_250: ci sta, restano 0. Risultato: `perSide` = [25_000, 25_000, 10_000, 1_250], cioè 25 + 25 + 10 + 1,25 kg per lato."
    }
  ],
  "summary": "Queste righe scompongono il peso di un lato in dischi. Si parte dal disco più grande, se ne mettono quanti più possibile, poi si passa al disco successivo più piccolo. È lo stesso metodo che usi per dare il resto con le monete: prima quelle grandi, poi quelle piccole. Questo modo di procedere si chiama «algoritmo goloso» (in inglese greedy): a ogni passo si sceglie il pezzo più grande che ci sta. Funziona perché i dischi sono considerati illimitati per taglio (ADR-004) e il peso è in grammi interi (ADR-003), quindi le sottrazioni sono esatte."
}
```
