**Ruolo**: è il cuore del livello `domain`. Contiene le regole che decidono se una prenotazione o una cancellazione è ammessa e i tipi che le descrivono. È codice puro: riceve dati e restituisce un esito (ADR-001, ADR-002).

**Dovrebbe**
- Definire i tipi del dominio: corso, prenotazione, richiesta.
- Esporre funzioni di decisione per prenotare e cancellare, che restituiscono un esito tipizzato.
- Modellare gli esiti previsti, cioè corso pieno, fuori tempo e già prenotato, come varianti di un'unione discriminata (ADR-002).
- Ricevere `now` come parametro, così i test fissano l'orario senza mock (ADR-002).

**Non dovrebbe**
- Importare `pg`, `fastify`, `fs` o usare `fetch` (ADR-002).
- Chiamare `new Date()` o `Date.now()` per leggere l'orario: l'orologio sta in `infra/` (ADR-002).
- Lanciare eccezioni per gli esiti previsti. Le eccezioni restano per i bug, cioè gli invarianti violati (ADR-002).
- Salvare dati o aprire transazioni. Lo fa il caso d'uso in `application/` attraverso una porta (ADR-003).

**Spunto**

```ts
export type CourseId = string & { readonly __brand: "CourseId" };
export type UserId = string & { readonly __brand: "UserId" };

export interface Course { id: CourseId; capacity: number; startsAt: Date; }
export interface Booking { courseId: CourseId; userId: UserId; createdAt: Date; }

export type BookingRejection = "COURSE_FULL" | "TOO_LATE" | "ALREADY_BOOKED";
export type CancelRejection = "TOO_LATE" | "NOT_BOOKED";

export type Decision<R> =
  | { ok: true; booking: Booking }
  | { ok: false; reason: R };

export declare function decideBooking(
  course: Course, existing: readonly Booking[], userId: UserId, now: Date
): Decision<BookingRejection>;

export declare function decideCancellation(
  course: Course, existing: readonly Booking[], userId: UserId, now: Date
): Decision<CancelRejection>;
```

Due note sulla struttura:
- **Brand sui tipi.** `CourseId` e `UserId` hanno un "brand", cioè un marchio di tipo che impedisce di scambiarli per errore (`buona pratica`).
- **Dove mettere le porte.** L'interfaccia di transazione e i repository richiesti da ADR-003 vanno in un file separato, `src/domain/ports.ts`. Così `booking.ts` resta solo regole e tipi.

Passare `existing` come lista intera è semplice e testabile. L'alternativa è passare solo il conteggio (`bookedCount`): è più leggera, ma non basta a riconoscere `ALREADY_BOOKED`.

**Domanda**: le finestre di tempo (quanto prima dell'inizio si può prenotare o cancellare) sono uguali per tutti i corsi o cambiano da corso a corso? Se cambiano, vanno dentro `Course`. Se sono uguali, conviene passarle come parametro `policy`.
