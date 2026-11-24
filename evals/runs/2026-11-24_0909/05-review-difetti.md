Il file mescola I/O, orologio ed eccezioni nel dominio: va diviso tra domain, application e infra prima di aggiungere altra logica.

> **[errore] righe 1-3, 7, 12 · ADR-002**
> Problema: `domain/booking.ts` importa `pg`, crea un `Pool` ed esegue query.
> Perché: il dominio non è più testabile senza Postgres, e il caso d'uso è incollato al database (ADR-001).
> Prova: in domain lascia solo regole pure. Le query vanno in un adapter in `infra/`, e l'orchestrazione in `application/prenota.ts`. Ecco una struttura possibile per il dominio:

```ts
// src/domain/booking.ts — solo firme
export type Course = { id: string; capacity: number; booked: number; startsAt: Date }

export type BookingOutcome =
  | { kind: 'confirmed' }
  | { kind: 'waitlisted' }

export function decideBooking(course: Course): BookingOutcome
export function canCancel(startsAt: Date, now: Date): boolean

// src/domain/ports.ts
export interface Clock { now(): Date }
export interface CourseRepository { findForUpdate(id: string): Promise<Course | null> }
```

> **[errore] riga 10 · ADR-002, bootstrap › Vincoli**
> Problema: il corso pieno lancia `Error('full')`. Inoltre manca la lista d'attesa.
> Perché: "corso pieno" è un esito previsto, non un guasto. Il bootstrap chiede di mettere l'iscritto in attesa, non di rifiutarlo.
> Prova: restituisci un valore tipo `BookingOutcome`, dove il caso pieno diventa `waitlisted`. Gestisci anche il corso inesistente (`course` può essere `undefined` alla riga 8) come esito esplicito.

> **[errore] riga 15 · ADR-002**
> Problema: `canCancel` legge `Date.now()`.
> Perché: il dominio non deve leggere l'orologio di sistema. Così non puoi testare il confine delle 12 ore (esattamente 12h, 12h meno un minuto) senza manipolare il tempo globale.
> Prova: aggiungi un parametro `now: Date`. Il caso d'uso lo prende da un `Clock` iniettato, la cui implementazione reale sta in `infra/`.

Proposta: **ADR-004: strategia contro l'overbooking.** Il controllo seguito dall'inserimento (righe 7-13) non è atomico. Con il picco del lunedì alle 7:00 due prenotazioni simultanee possono superare la capienza. Serve decidere tra `SELECT … FOR UPDATE` in una transazione e un `UPDATE … WHERE booked < capacity` condizionale.
