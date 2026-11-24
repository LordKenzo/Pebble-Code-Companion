**Gradino 2 · Direzione precisa**
Il punto da guardare è prima della riga 14. Con `total` = 15000, `remaining` diventa -2500: nessun disco entra nel ciclo, e alla riga 22 restituisci `ok({ total, perSide })` con `total` ancora 15000 e nessun avviso. È proprio quello che dice il test: "ricevuto total 15000 e 0 avvisi".

Serve un controllo all'inizio di `platesFor`: se `total` è sotto `BAR`, la funzione deve fermarsi subito e restituire un esito diverso. Quell'esito ha come totale il solo bilanciere, nessun disco e un avviso (ADR-004). In `result.ts` cerca la funzione che crea un esito «ok con avviso»: è quella da usare qui, al posto di `ok`.

**Concetto:** clausola di guardia (guard clause), cioè un controllo all'inizio di una funzione che gestisce subito il caso speciale e la fa uscire prima del calcolo normale.
