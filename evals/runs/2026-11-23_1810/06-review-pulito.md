Rispetta ADR-002: niente orologio di sistema (`now` arriva come parametro) e gli esiti previsti sono valori di ritorno, non eccezioni.

> **[info] riga 10 · buona pratica**  
> Problema: il parametro `booking` non viene mai usato. L'esito dipende solo da `startsAt` e `now`.  
> Perché: chi chiama la funzione deve procurarsi una `Booking` anche quando non serve. Questo complica i test e lascia pensare che la prenotazione influisca sull'esito.  
> Prova: decidi se la `Booking` deve contare davvero, per esempio se una prenotazione già cancellata deve dare un esito a parte. Se sì, aggiungi quel caso a `CancelOutcome`. Se no, togli il parametro e lascia la firma `(startsAt, now)`.

Il bootstrap dice "fino a 12 ore prima": a 12 ore esatte la cancellazione è gratuita, come fa oggi il tuo `>=`, o è già tardiva?
