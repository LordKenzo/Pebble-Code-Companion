Il file rispetta ADR-002: riceve `now` come parametro, non legge l'orologio, e gli esiti sono valori di ritorno tipizzati.

> **[info] riga 10 · best practice**  
> Problema: il parametro `booking` non viene mai letto. L'esito dipende solo da `startsAt` e `now`.  
> Perché: chi chiama deve passare un `Booking` che non serve. Inoltre la firma suggerisce che lo stato della prenotazione conti, ma oggi non conta.  
> Prova: decidi se `booking` deve influire sull'esito, per esempio una prenotazione già cancellata o in lista d'attesa. Se sì, aggiungi i casi a `CancelOutcome`. Se no, togli il parametro e l'import di `Booking`.

Domanda: chi è in lista d'attesa (`bootstrap › Vincoli`) e cancella a meno di 12 ore dal corso deve ricevere `late` come gli altri, o per lui la cancellazione è sempre gratuita?
