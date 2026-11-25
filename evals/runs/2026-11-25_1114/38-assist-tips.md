```json
{
  "tips": [
    {
      "where": "righe 10, 18",
      "title": "Sotto i 20 kg esce un «ok» senza avviso",
      "body": "Con 15 kg (15000 g), `remaining` alla riga 10 vale -2500. Nessun disco entra nel ciclo e la riga 18 restituisce `ok` con `perSide` vuoto. Il test «15 kg: solo bilanciere, con avviso» si aspetta invece l'esito «solo bilanciere» con avviso. Controlla prima del ciclo il caso `total` sotto `BAR` e restituisci l'esito con avviso previsto in `result.ts`.",
      "anchor": "ADR-004"
    },
    {
      "where": "righe 13-18",
      "title": "Il resto non scomponibile sparisce in silenzio",
      "body": "Con 61 kg, `remaining` parte da 20500. Dopo il disco da 20000 restano 500 g che nessun disco copre. Il ciclo finisce e la riga 18 dichiara `ok` su un carico che non corrisponde al bilanciere, da cui il rosso su «61 kg: avviso sul resto». Dopo il ciclo guarda quanto vale `remaining`: se non è 0, il risultato deve portare un avviso. Fai attenzione anche ai totali dispari in grammi (es. 20001): la divisione alla riga 10 produce mezzi grammi, fuori dai grammi interi.",
      "anchor": "ADR-004, ADR-003"
    },
    {
      "where": "righe 21-23",
      "title": "`loadsFor` anticipa il passo 4 e non dichiara cosa restituisce",
      "body": "La roadmap mette i carichi da percentuali al passo 4. Ora questa funzione è uno stub senza tipo di ritorno: con `tsc` strict viene dedotto `void`, e chi la chiamerà non avrà un contratto. Puoi toglierla finché non arrivi al passo 4, oppure dichiararle subito un ritorno `Result<…>` e `readonly number[]` per le percentuali. Gli input fuori da 1–100 sono un esito non valido, quindi il tipo deve poterlo esprimere.",
      "anchor": "ADR-004, roadmap › passo 4"
    }
  ]
}
```
