**Gradino 2 · Direzione precisa**
Alla riga 14, con 15 kg, `remaining` vale (15 000 − 20 000) / 2 = −2 500 grammi. Nessun disco è minore o uguale a un numero negativo, quindi il ciclo `while` non aggiunge niente. Poi la riga 22 restituisce `ok` con `total` ancora a 15 000 e senza avvisi, ed è proprio quello che il test riceve.

Prima della riga 14, controlla se `total` è sotto `BAR`. In quel caso la funzione deve uscire subito, come chiede ADR-004: `total` pari al bilanciere, nessun disco e un esito «ok con avviso». Guarda in `result.ts` quale funzione crea quel tipo di esito.

**Concetto:** clausola di guardia (un controllo a inizio funzione che gestisce subito il caso speciale e ne esce).
