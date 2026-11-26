# src/domain/booking.ts

**Ruolo**
È il cuore delle regole di prenotazione, nel livello `domain` (ADR-001). Definisce i tipi di una prenotazione e decide se una nuova prenotazione è ammessa, partendo solo dai dati che riceve.

**Deve**
- Definire i tipi `Booking`, `Course` e gli identificativi, usando *branded types* per non confondere un `CourseId` con un `MemberId` (`best practice`).
- Esporre una funzione pura che decide l'esito di una richiesta di prenotazione (ADR-002).
- Restituire gli esiti previsti (corso pieno, fuori tempo, già prenotato) come un'unione discriminata, non come eccezioni (ADR-002).
- Ricevere `now` come parametro, così i test non dipendono dall'orologio (ADR-002).

**Non deve**
- Importare `pg`, `fastify`, `fetch` o `fs`, né chiamare `new Date()` o `Date.now()` (ADR-002).
- Generare id o leggere numeri casuali. Restituisce una bozza senza id, che poi salva l'adapter in `infra/` (ADR-002, ADR-003).
- Contenere SQL o gestire transazioni. L'interfaccia della transazione va in `src/domain/ports.ts`, perché è un contratto e non una regola (ADR-003, `best practice`).
- Sapere chi la chiama: niente tipi HTTP o DTO di richiesta (ADR-001).

**Punto di partenza**

```ts
export type CourseId = string & { readonly __brand: 'CourseId' };
export type MemberId = string & { readonly __brand: 'MemberId' };
export type BookingId = string & { readonly __brand: 'BookingId' };

export interface Course { id: CourseId; capacity: number; startsAt: Date; }
export interface Booking { id: BookingId; courseId: CourseId; memberId: MemberId; createdAt: Date; }
export type BookingDraft = Omit<Booking, 'id'>;

export type BookingDecision =
  | { kind: 'ammessa'; draft: BookingDraft }
  | { kind: 'corso_pieno' }
  | { kind: 'gia_prenotato' }
  | { kind: 'fuori_tempo'; deadline: Date };

export declare const BOOKING_CUTOFF_MINUTES: number;

export declare function decideBooking(
  course: Course, existing: readonly Booking[], memberId: MemberId, now: Date,
): BookingDecision;
```

`existing` contiene le prenotazioni attive del corso. Con quelle la funzione controlla sia la capienza sia il doppione, senza fare query. Un'alternativa è passare solo un contatore: è più leggera, ma perde il controllo sul doppione.

Domanda: la scadenza per prenotare è un margine fisso prima di `startsAt` (per esempio 30 minuti), oppure cambia da corso a corso? Se cambia, il margine diventa un campo di `Course` e la costante va tolta.
