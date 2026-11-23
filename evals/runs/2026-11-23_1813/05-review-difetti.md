Il file mescola dominio e persistenza: va diviso tra `domain/` e `infra/` prima di aggiungere logica.

> **[errore] riga 1-3 · ADR-002, ADR-003**  
> Problema: `domain/booking.ts` importa `pg`, crea un `Pool` ed esegue SQL.  
> Perché: il dominio deve restare puro e testabile senza database. L'SQL appartiene agli adapter in `infra/`.  
> Prova: in `domain/` lascia solo tipi e regole. Definisci lì una porta, per esempio `interface BookingRepository`, e implementala in `infra/postgres/`. Le query si spostano nell'implementazione.

> **[errore] riga 9-13 · bootstrap › Vincoli, ADR-003**  
> Problema: leggi la capienza e poi inserisci la prenotazione in due query separate, senza transazione né lock. Inoltre `booked` non viene mai aggiornato.  
> Perché: con il picco del lunedì alle 7:00 due richieste leggono lo stesso `booked` ed entrambe passano. Il risultato è un corso in overbooking.  
> Prova: rendi atomico il controllo più l'inserimento nell'adapter. Puoi usare `SELECT … FOR UPDATE` in una transazione, oppure un `UPDATE … WHERE booked < capacity` controllando le righe aggiornate.

> **[errore] riga 11, 17 · ADR-002**  
> Problema: `throw new Error('full')` usa un'eccezione per un esito previsto, e `canCancel` legge `Date.now()`.  
> Perché: gli esiti attesi devono essere valori di ritorno. Inoltre un dominio che legge l'orologio di sistema non si può testare sul limite delle 12 ore.  
> Prova:
> ```ts
> type BookingOutcome = { kind: 'confirmed' } | { kind: 'waitlisted' } | { kind: 'not_found' }
> function decideBooking(course: Course, now: Date): BookingOutcome
> function canCancel(startsAt: Date, now: Date): boolean
> ```

ADR da proporre: **"Strategia di concorrenza sulle prenotazioni"**. Serve a decidere tra lock pessimistico e `UPDATE` condizionale prima del picco del lunedì, perché la scelta cambia sia l'adapter sia la porta delle transazioni.

Domanda: quando un posto si libera, il primo in lista d'attesa viene promosso automaticamente o riceve un'offerta da confermare?
