**Gradino 2 · Direzione precisa**
Con 15 kg, alla riga 14 `remaining` vale (15 000 − 20 000) / 2 = −2 500. Nessun disco è minore o uguale a un numero negativo, quindi il ciclo non aggiunge niente. Poi la riga 22 restituisce `total` così com'è (15 000) e nessun avviso: è proprio quello che dice il test rosso.

Il controllo va messo **prima** della riga 14: se `total` è sotto `BAR`, `platesFor` deve fermarsi subito e restituire un risultato con `total` uguale a `BAR`, nessun disco e un avviso (ADR-004). Apri `result.ts` e cerca se, oltre a `ok`, c'è già una funzione per l'esito «ok con avviso».

**Concetto:** clausola di guardia (un controllo all'inizio della funzione che gestisce subito un caso limite, prima del calcolo normale)
