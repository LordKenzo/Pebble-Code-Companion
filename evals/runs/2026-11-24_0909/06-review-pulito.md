Il file rispetta ADR-002: riceve `now` come parametro e restituisce gli esiti come valori. Il confine delle 12 ore (`>=`, quindi esattamente 12 ore è gratuita) è coerente con il bootstrap.

> **[info] riga 11 · bootstrap › Vincoli**  
> Problema: `booking` è nella firma ma non viene mai letto, quindi l'esito dipende solo dagli orari.  
> Perché: il bootstrap prevede la lista d'attesa. Chi cancella un posto in attesa non occupa un posto, e chi cancella una prenotazione già cancellata non dovrebbe ricevere `free`.  
> Prova: decidi se lo stato della prenotazione cambia l'esito. Se sì, leggilo da `booking` e aggiungi una variante a `CancelOutcome`. Se no, togli il parametro.

Domanda: oltre le 12 ore la cancellazione è vietata, oppure è permessa e comporta una penale (es. perdi l'ingresso)? Da questo dipende cosa deve fare l'application layer con `late`.
