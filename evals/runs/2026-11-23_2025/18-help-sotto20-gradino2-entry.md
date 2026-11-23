**Gradino 2 · Direzione precisa**

Il problema nasce **prima** della riga 14. Con `total` = 15000, `remaining` diventa (15000 − 20000) / 2 = −2500. Il ciclo non aggiunge dischi, quindi non vedi dischi negativi, ma la funzione arriva alla riga 22 e restituisce `total` 15000 con un semplice `ok`, senza avviso. Per questo il test riceve 15000 e 0 avvisi.

Tra la riga 13 e la 14 aggiungi un controllo: se `total` è minore di `BAR`, esci subito dalla funzione (*uscita anticipata*). Restituisci un risultato con `total` uguale a `BAR`, nessun disco per lato e un avviso, cioè l'esito «ok con avviso» previsto da ADR-004. Guarda in `result.ts` quale funzione crea quell'esito. Alla riga 2 oggi importi solo `ok`.

**Concetto:** caso limite gestito con un'uscita anticipata (guard clause)
