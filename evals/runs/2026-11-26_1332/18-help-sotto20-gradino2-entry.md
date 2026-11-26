**Gradino 2 · Direzione precisa**
Il problema nasce prima della riga 14. Con `total` = 15000, `remaining` vale (15000 − 20000) / 2 = −2500. Nessun disco è ≤ −2500, quindi il ciclo non aggiunge niente e la riga 22 restituisce `total` 15000 con `ok` semplice, senza avviso.

Serve un controllo all'inizio di `platesFor`, prima della riga 14: se `total` è minore di `BAR`, la funzione deve uscire subito con un risultato «ok con avviso» (ADR-004). Quel risultato ha `total` uguale a `BAR` e `perSide` vuoto. Guarda in `result.ts` quale funzione crea un esito con avviso.

**Concetto:** clausola di guardia, cioè un controllo all'inizio della funzione che gestisce un caso speciale ed esce subito.
