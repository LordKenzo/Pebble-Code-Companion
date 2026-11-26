Il file rispetta ADR-002: niente I/O, `now` passato dall'esterno, gli esiti sono valori di ritorno. Il confine delle 12 ore è corretto, perché `>=` rende gratuita la cancellazione esattamente a 12 ore.

> **[info] riga 10 · best practice**  
> Problema: `booking` non viene mai letto. La funzione usa solo `startsAt` e `now`.  
> Perché: una firma che chiede dati inutili confonde chi la chiama da application e complica i test, perché serve costruire un `Booking` finto.  
> Prova: se `Booking` contiene già l'orario del corso, togli `startsAt` e leggilo da lì. Altrimenti rimuovi `booking` dalla firma.

Domanda: una prenotazione già cancellata o in lista d'attesa può arrivare a questa funzione? Se sì, è il motivo per tenere `booking` e aggiungere un esito apposito.
