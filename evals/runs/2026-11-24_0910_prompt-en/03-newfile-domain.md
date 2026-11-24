**Ruolo**
`booking.ts` contiene le regole della prenotazione: dati un corso, le prenotazioni esistenti e l'istante attuale, decide l'esito. Sta nel livello **domain**, il centro dell'esagono (ADR-001). Tutti gli altri livelli lo usano, e lui non dipende da nessuno.

**Deve**
- Definire i tipi del dominio: corso, prenotazione, esito (ADR-002).
- Esprimere gli esiti previsti (corso pieno, fuori tempo, già prenotato) come un **tipo unione discriminato**, cioè valori di ritorno e non eccezioni (ADR-002).
- Ricevere l'istante attuale come parametro `now: Date`, così i test fissano il tempo senza mock (ADR-002).
- Restare deterministico: stessi input, stesso output (`best practice`, testabilità).

**Non deve**
- Importare `pg`, `fastify`, `fs` o fare `fetch` (ADR-002).
- Chiamare `new Date()` o `Date.now()` per conoscere l'ora: l'orologio sta in `infra/` (ADR-002).
- Contenere SQL o gestire transazioni. Qui non va nemmeno l'interfaccia della transazione: mettila in un file separato, per esempio `src/domain/ports.ts`, come contratto per l'adapter (ADR-003).
- Lanciare eccezioni per esiti di business. Le eccezioni restano per gli invarianti violati, cioè i bug (ADR-002).

**Punto di partenza**
Le firme qui sotto sono solo dichiarazioni. Il corpo di `decideBooking` lo scrivi tu.

```ts
export type CourseId = string;
export type MemberId = string;

export interface Course {
  id: CourseId;
  capacity: number;
  startsAt: Date;
  bookingClosesMinutesBefore: number;
}

export interface Booking { courseId: CourseId; memberId: MemberId; bookedAt: Date }

export type BookingOutcome =
  | { kind: "booked"; booking: Booking }
  | { kind: "courseFull" }
  | { kind: "tooLate" }
  | { kind: "alreadyBooked" };

export function decideBooking(course: Course, existing: readonly Booking[], memberId: MemberId, now: Date): BookingOutcome;
```

Note sulla proposta:
- Ho aggiunto `alreadyBooked` come esito previsto (`best practice`). Se il dominio permette prenotazioni doppie, toglilo.
- Per il caso d'uso *cancella* aggiungerai una `decideCancellation` con lo stesso schema, nello stesso file finché resta piccolo.
- `decideBooking` non salva nulla. Il caso d'uso in `application/` riceve l'esito e chiede all'adapter di persistere solo se `kind === "booked"` (ADR-001).

**Domanda:** come funziona la regola "fuori tempo"? Le prenotazioni si chiudono un numero fisso di minuti prima dell'inizio, uguale per tutti i corsi, oppure ogni corso ha la sua finestra? Dalla risposta dipende se `bookingClosesMinutesBefore` resta nel tipo `Course` o diventa una costante del dominio.
