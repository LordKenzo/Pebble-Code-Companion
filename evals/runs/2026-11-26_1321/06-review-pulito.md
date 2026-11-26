Il file rispetta ADR-002: dominio puro, l'orologio arriva da fuori con `now` e gli esiti sono valori di ritorno. I confini sono giusti: a 12 ore esatte la cancellazione è gratuita, all'orario di inizio il corso risulta già iniziato.

> **[info] riga 10 · best practice**  
> Problema: il parametro `booking` non viene mai letto. La funzione usa solo `startsAt` e `now`.  
> Perché: chi chiama dall'application deve recuperare una `Booking` che non serve. La firma promette anche un controllo che non c'è, per esempio su una prenotazione già cancellata o in lista d'attesa.  
> Prova: decidi se lo stato della prenotazione cambia l'esito. Se lo cambia, aggiungi una variante a `CancelOutcome` (es. `{ kind: 'not-cancellable' }`) e un test descritto a parole: "una prenotazione già cancellata non dà mai `free`". Se non lo cambia, togli `booking` dalla firma.

Domanda: una prenotazione in lista d'attesa si cancella con la stessa regola delle 12 ore o sempre gratis?
