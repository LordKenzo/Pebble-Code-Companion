**Gradino 2 · Direzione precisa**
Con 15 kg, alla riga 14 `remaining` vale (15 000 − 20 000) / 2 = −2 500 grammi. Il ciclo non aggiunge nessun disco, quindi la funzione arriva alla riga 22 e restituisce `ok` con `total` 15 000 e nessun avviso. Il test invece si aspetta `total` 20 000 e 1 avviso (ADR-004: «solo bilanciere»).

Prova così:
1. Prima della riga 14, controlla se `total` è minore di `BAR`.
2. In quel caso esci subito: `total` uguale a `BAR`, `perSide` vuoto, più un avviso.
3. Apri `result.ts` e cerca il costruttore del risultato «ok con avviso», da usare al posto di `ok`.

**Concetto:** clausola di guardia (un controllo all'inizio della funzione che gestisce il caso speciale ed esce subito).
