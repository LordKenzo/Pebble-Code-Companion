**Gradino 1 · Domanda**

Il file dà già errori prima ancora di arrivare al test: l'editor non trova `describe`, `it` ed `expect`, e segnala una graffa mancante alla riga 7. Quindi il test non può dire nulla finché il file non compila. Non è un problema di logica, ed è giusto sistemarlo prima.

Guarda la riga 3: quante parentesi graffe `{` aperte vedi, e quante `}` ne chiudono il blocco? Il `describe` apre un blocco e l'`it` ne apre un altro dentro. Quante chiusure servono?
