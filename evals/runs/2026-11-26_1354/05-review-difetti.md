Il file contraddice tre decisioni del progetto: il dominio parla direttamente con il database, legge l'orologio di sistema e lancia eccezioni invece di restituire esiti.

> **[errore] riga 1-2 · ADR-002, ADR-003**
> Problema: `domain/booking.ts` importa `pg` e crea un `Pool` globale: il dominio fa I/O.
> Perché: il dominio deve restare puro e testabile senza database. Con il Pool a livello di modulo, ogni test tocca Postgres.
> Prova: sposta le query in un adapter in `infra/` (es. `PgBookingRepository`). In `domain/` definisci solo un'interfaccia (es. `BookingRepository`) che riceve e restituisce dati semplici. Il domain non deve più conoscere `pg`.

> **[errore] riga 6, 10, 17 · ADR-002**
> Problema: `canCancel` legge `Date.now()`, e `create` lancia `throw new Error('full')` invece di restituire l'esito.
> Perché: l'ADR chiede che il dominio riceva l'orario e restituisca gli esiti previsti come valori. Un orologio nascosto rende i test dipendenti dal momento in cui girano, e l'eccezione per il caso "corso pieno" obbliga chi chiama a usare try/catch per un caso normale.
> Prova: passa `now: Date` come parametro a `canCancel`, e fai restituire a `create` un tipo come `{ ok: false, reason: 'full' } | { ok: true }`.

> **[errore] riga 4-10 · bootstrap › Picchi di prenotazioni il lunedì alle 7:00**
> Problema: il controllo di capienza e l'`INSERT` sono due istruzioni separate, senza transazione. `course` può anche essere `undefined` se l'id non esiste, e `course.booked` farebbe crashare.
> Perché: alle 7:00 del lunedì due richieste possono leggere entrambe `booked = capacity - 1` e inserire entrambe: il corso si riempie oltre la capienza. Il controllo va fatto dentro la stessa transazione, con un lock sulla riga del corso.
> Prova: nell'adapter Postgres, apri una transazione tramite l'interfaccia definita in domain (ADR-003), fai `SELECT ... FROM courses WHERE id = $1 FOR UPDATE`, gestisci il caso di corso inesistente restituendo un esito, poi inserisci. Scrivi un test che lanci due prenotazioni concorrenti sull'ultimo posto: deve passarne una sola.
