Il file rispetta ADR-002: dominio puro, `now` ricevuto come parametro, esiti come valori di ritorno. Anche il confine delle 12 ore esatte, che restano gratuite con `>=`, è coerente con "fino a 12 ore prima" (bootstrap › Vincoli).

> **[info] riga 10 · best practice**  
> Problema: il parametro `booking` non viene mai letto. Serve solo `startsAt`.  
> Perché: chi chiama la funzione deve costruire un `Booking` che non conta per l'esito. Chi legge la firma pensa che lo stato della prenotazione influisca sul risultato.  
> Prova: se non ti serve, toglilo dalla firma. Se invece una prenotazione già cancellata deve dare un esito diverso, aggiungi quel caso a `CancelOutcome` e scrivi un test che lo verifichi.
