**Gradino 2 · Direzione precisa**
Con 15 kg, alla riga 14 `remaining` vale (15000 − 20000) / 2 = −2500. Un numero negativo non è mai `>= plate`, quindi il ciclo non aggiunge dischi. Poi la riga 22 restituisce sempre `ok` con il `total` ricevuto. Ecco perché il test vede 15000 e 0 avvisi.

Prima della riga 14 serve un controllo: se `total` è sotto `BAR`, la funzione deve fermarsi subito. Deve restituire `total` uguale a `BAR`, nessun disco e un esito «ok con avviso» preso da `result.ts`, non `ok` (ADR-004).

**Concetto:** clausola di guardia (un controllo all'inizio che gestisce un caso speciale prima del calcolo normale)
