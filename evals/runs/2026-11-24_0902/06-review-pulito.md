Il file rispetta ADR-002: niente orologio di sistema (`now` arriva da fuori), esiti come valori di ritorno, e il confine delle 12 ore è incluso nella cancellazione gratuita, come chiede il bootstrap.

> **[info] riga 11 · buona pratica**  
> Problema: il parametro `booking` non viene mai usato. L'orario di inizio arriva separato in `startsAt`.  
> Perché: chi chiama la funzione può passare una prenotazione e l'orario di un altro corso, e nessun controllo se ne accorge. Inoltre una firma con parametri inutili confonde chi la legge.  
> Prova: se `Booking` contiene già l'orario del corso, togli `startsAt` dalla firma e prendi l'orario da `booking`. Altrimenti togli `booking`.

Domanda: in `Booking` c'è uno stato (attiva, cancellata, in lista d'attesa)? Se c'è, la funzione deve decidere cosa restituire quando la prenotazione è già cancellata, e quello sarebbe il vero uso di `booking`.
