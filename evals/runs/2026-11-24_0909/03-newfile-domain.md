**Ruolo**
Contiene le regole della prenotazione: dato un corso, le prenotazioni esistenti e l'istante corrente, decide se si può prenotare. Sta in `domain/`, il livello più interno, da cui dipendono tutti gli altri (ADR-001).

**Dovrebbe**
- Definire i tipi del dominio: corso, prenotazione, esito.
- Esporre una funzione pura che decide l'esito di una richiesta di prenotazione.
- Rappresentare "corso pieno" e "fuori tempo" come varianti di un tipo di ritorno, non come eccezioni (ADR-002).
- Ricevere `now` come parametro, così i test fissano l'istante che vogliono (ADR-002).

**Non dovrebbe**
- Importare `pg`, `fastify`, `fs` o qualunque altra libreria di I/O (ADR-002).
- Chiamare `new Date()` o `Date.now()`: l'orologio è un adapter in `infra/` e il caso d'uso passa l'istante (ADR-002).
- Contenere SQL o la gestione delle transazioni. L'interfaccia della transazione sta sì in domain, ma in un file a parte, per esempio `src/domain/ports.ts`, perché è un contratto verso infra e non una regola (ADR-003).
- Orchestrare il flusso "leggi, decidi, salva": quello è il caso d'uso in `application/` (ADR-001).

**Spunto**

```ts
export type CourseId = string;
export type MemberId = string;

export interface Course {
  id: CourseId;
  capacity: number;
  startsAt: Date;
}

export interface Booking {
  courseId: CourseId;
  memberId: MemberId;
  bookedAt: Date;
}

export type BookingOutcome =
  | { kind: "booked"; booking: Booking }
  | { kind: "course-full" }
  | { kind: "too-late" };

export function decideBooking(course: Course, activeBookings: number, memberId: MemberId, now: Date): BookingOutcome;
```

Il campo `kind` rende `BookingOutcome` un'unione discriminata. Con uno `switch` su `kind`, il compilatore segnala se in `application/` o in `http/` dimentichi un esito (`buona pratica`). Il parametro `activeBookings` è un numero e non una lista, così il dominio non dipende da come infra conta le righe.

Domanda: il limite per prenotare (es. "fino a 2 ore prima dell'inizio") è uguale per tutti i corsi o varia da corso a corso? Se varia, diventa un campo di `Course`. Se è fisso, è una costante esportata da questo file.
