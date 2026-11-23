Il file rispetta ADR-002: l'orologio arriva da fuori come `now`, gli esiti sono valori di ritorno e il confine delle 12 ore è incluso nella cancellazione gratuita, coerente con "fino a 12 ore prima".

> **[info] riga 10 · buona pratica**  
> Problema: `booking` non viene mai letto; la funzione usa solo `startsAt` e `now`.  
> Perché: chi la chiama deve comunque procurarsi un `Booking`. Nei test dovrai costruirne uno finto per niente. La firma promette un controllo, per esempio sullo stato, che non c'è.  
> Prova: togli il parametro e lascia `(startsAt, now)`. In alternativa usalo davvero, se una prenotazione già cancellata deve dare un esito a sé.

Una prenotazione già cancellata o in lista d'attesa deve passare da questa funzione, oppure la filtra il livello application prima di chiamarla?
