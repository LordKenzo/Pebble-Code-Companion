Il file mescola dominio e infrastruttura: viola ADR-002 e ADR-003, e sotto i picchi del lunedì può superare la capienza.

> **[errore] righe 1-3, 7, 12 · ADR-002, ADR-003**  
> Problema: `domain/` importa `pg`, crea un `Pool` e scrive SQL.  
> Perché: il dominio deve restare puro e testabile senza database. Inoltre leggere `booked` e poi fare `INSERT` in due query separate, senza transazione, lascia passare due prenotazioni sull'ultimo posto. È proprio il caso del lunedì alle 7:00 (bootstrap › Vincoli).  
> Prova: sposta query e transazione in un adapter in `infra/`. In `domain/` lascia una funzione pura che decide sull'esito, per esempio `decideBooking(course: Course, memberId: MemberId): BookingOutcome`.

> **[errore] riga 10 · ADR-002**  
> Problema: "corso pieno" è un'eccezione `throw new Error('full')`.  
> Perché: gli esiti previsti sono valori di ritorno. La lista d'attesa (bootstrap › Vincoli) è un esito normale, non un errore. Manca anche il caso del corso inesistente: con `course` undefined, la riga 9 va in crash.  
> Prova: definisci un'unione discriminata `BookingOutcome` con le varianti `confirmed`, `waitlisted` e `courseNotFound`, e restituiscila.

> **[errore] riga 16 · ADR-002**  
> Problema: `canCancel` legge `Date.now()`.  
> Perché: il dominio non legge l'orologio di sistema. Senza un "adesso" passato da fuori non puoi testare il confine delle 12 ore esatte.  
> Prova: aggiungi il parametro `now: Date`. L'orologio diventa un adapter in `infra/`, chiamato dal caso d'uso in `application/`.

Proposta ADR: **ADR-004: prenotazione atomica sotto concorrenza.** Serve decidere come garantire la capienza durante i picchi: lock sulla riga del corso, vincolo nel database o contatore aggiornato in modo condizionale.

Domanda: quando un posto si libera, il primo in lista d'attesa viene promosso automaticamente oppure riceve un'offerta da accettare?
