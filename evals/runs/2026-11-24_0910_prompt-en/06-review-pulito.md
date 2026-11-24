Il file rispetta ADR-002: `now` arriva da fuori, nessun I/O, gli esiti sono valori di ritorno. Anche il confine delle 12 ore è corretto (`>=` rende gratuita la cancellazione a 12 ore esatte, come chiede il bootstrap).

> **[info] riga 10 · best practice**  
> Problema: il parametro `booking` non viene mai letto. La funzione usa solo `startsAt` e `now`.  
> Perché: chi la chiama deve recuperare una `Booking` che poi non serve. Così la firma promette un controllo che non esiste, per esempio su una prenotazione già cancellata o in lista d'attesa.  
> Prova: decidi se lo stato della prenotazione deve influire sull'esito. Se deve influire, aggiungi un caso a `CancelOutcome` e un test che lo copra. Se non deve influire, togli il parametro.
