**Ruolo**: le regole di prenotazione di un corso nel livello `domain`: dato lo stato del corso e l'istante attuale, decide se una prenotazione o una cancellazione è ammessa e con quale esito. È il cuore puro che `application/` chiamerà (ADR-001).

**Dovrebbe**
- Definire i tipi del dominio: corso, prenotazione, esiti possibili.
- Decidere se una prenotazione si può fare (posti liberi, finestra temporale, nessun doppione).
- Decidere se una cancellazione si può fare (entro il limite di tempo).
- Restituire gli esiti previsti come valori di un'unione discriminata, per esempio `{ kind: 'full' }`, invece di lanciare eccezioni (ADR-002).

**Non dovrebbe**
- Importare `pg`, `fastify`, `fs` o fare `fetch` (ADR-002).
- Chiamare `new Date()` o `Date.now()`: l'istante arriva come parametro `now`, e lo fornisce l'orologio in `infra/` (ADR-002).
- Contenere SQL o gestire transazioni. L'interfaccia della transazione sta in domain (ADR-003), ma in un file a parte, per esempio `src/domain/ports.ts`, non qui: questo file resta solo regole.
- Salvare o caricare dati. Riceve lo stato e restituisce una decisione, e a persistere ci pensa il caso d'uso.

**Spunto** (solo dichiarazioni)

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
  createdAt: Date;
}

export type BookResult =
  | { kind: 'booked'; booking: Booking }
  | { kind: 'full' }
  | { kind: 'too_late' }
  | { kind: 'already_booked' };

export type CancelResult = { kind: 'cancelled' } | { kind: 'too_late' };

export function decideBooking(course: Course, existing: readonly Booking[], memberId: MemberId, now: Date): BookResult;
export function decideCancellation(course: Course, booking: Booking, now: Date): CancelResult;
```

Le funzioni ricevono un array `readonly`, quindi non possono modificare lo stato: lo restituiscono deciso. In più si testano senza database né mock dell'orologio (buona pratica, testabilità).

Domanda: qual è la regola esatta del "fuori tempo"? Per esempio, si può prenotare fino all'inizio del corso e cancellare fino a N ore prima? Da questo dipende se il limite va dentro `Course` o in una costante del dominio.
