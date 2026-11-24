**Gradino 2 · Direzione precisa**
Con 15 kg, alla riga 14 `remaining` vale (15000 − 20000) / 2 = −2500 grammi. Nessun disco è minore o uguale a −2500, quindi il ciclo `for` non aggiunge niente. Poi la riga 22 restituisce `ok` con il `total` originale, cioè 15000 e nessun avviso: è proprio quello che dice il test rosso.

Prima della riga 14 serve un controllo: se `total` è minore di `BAR`, la funzione deve fermarsi subito. Deve restituire un carico di `BAR` senza dischi, con l'avviso (ADR-004). In `result.ts` cerca la funzione che crea un esito «ok con avviso».

**Concetto:** clausola di guardia (un controllo all'inizio della funzione che gestisce subito il caso speciale)
