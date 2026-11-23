**Ruolo**: è il cuore del livello `domain`. Definisce cos'è una prenotazione e decide, da dati già pronti, se una richiesta di prenotazione o di cancellazione è ammessa. È codice puro: nessun I/O e nessun accesso all'orologio (ADR-001, ADR-002).

**Dovrebbe**
- Definire i tipi `Booking` e `Course`, con il minimo che serve alle regole.
- Esporre funzioni di decisione che ricevono `now` come parametro e restituiscono un esito (ADR-002).
- Modellare gli esiti previsti (corso pieno, fuori tempo, già prenotato) come un'unione discriminata. Così il compilatore ti obbliga a gestirli tutti (`buona pratica`).

**Non dovrebbe**
- Importare `pg`, `fastify`, `fs` o chiamare `new Date()` / `Date.now()` (ADR-002). L'orologio arriva da `infra/` passando per `application/`.
- Lanciare eccezioni per esiti previsti. Restano per i bug veri, cioè gli invarianti violati (ADR-002).
- Salvare o leggere prenotazioni. Lo fa `application/` tramite una porta (ADR-001).
- Contenere l'interfaccia delle transazioni (ADR-003). Mettila in un file separato, per esempio `src/domain/ports.ts`, insieme al repository. Così `booking.ts` resta solo regole.

**Spunto**

```ts
export type CourseId = string & { readonly __brand: 'CourseId' };
export type UserId = string & { readonly __brand: 'UserId' };

export interface Course {
  readonly id: CourseId;
  readonly capacity: number;
  readonly startsAt: Date;
}

export interface Booking {
  readonly courseId: CourseId;
  readonly userId: UserId;
  readonly createdAt: Date;
}

export type BookingOutcome =
  | { readonly kind: 'booked'; readonly booking: Booking }
  | { readonly kind: 'course_full' }
  | { readonly kind: 'too_late' }
  | { readonly kind: 'already_booked' };

export function decideBooking(course: Course, existing: readonly Booking[], userId: UserId, now: Date): BookingOutcome;
```

Per la cancellazione aggiungi in seguito `decideCancellation(booking, course, now)` con una sua unione di esiti (`cancelled` | `too_late`). I brand su `CourseId` e `UserId` evitano di scambiare due stringhe per errore (`buona pratica`). Se ti pesano, l'alternativa è usare `string` semplice.

Il primo test da scrivere: con il corso al completo, `decideBooking` restituisce `course_full`.

Domanda: "fuori tempo" quanto vale? Un numero fisso di ore prima dell'inizio, o un valore configurabile per singolo corso? Se è per corso, va dentro `Course`. Se è globale, diventa un parametro della policy.
