**Ruolo**
Contiene il cuore della prenotazione: tipi e regole che decidono se una prenotazione è ammessa. Sta in `domain/`, il livello più interno (ADR-001). Non sa nulla di database, HTTP o orologio.

**Dovrebbe**
- Definire i tipi del dominio: corso, prenotazione, esito della richiesta.
- Esporre funzioni pure che, dati corso, prenotazioni esistenti e istante corrente, restituiscono un esito (ADR-002).
- Modellare gli esiti previsti (corso pieno, fuori tempo, già prenotato) come varianti di un'unione discriminata, non come `throw` (ADR-002).

**Non dovrebbe**
- Chiamare `new Date()` o `Date.now()`: l'istante arriva come parametro `now` (ADR-002).
- Importare `pg`, `fastify` o qualsiasi cosa da `infra/` o `http/` (ADR-001, ADR-002).
- Contenere SQL o caricare dati: il caricamento lo fa il caso d'uso in `application/` tramite gli adapter (ADR-003).
- Ospitare l'interfaccia delle transazioni e dei repository: mettila in un file a parte, `src/domain/ports.ts`, così `booking.ts` resta solo regole (ADR-003, `buona pratica`).

**Spunto**

```ts
export type CourseId = string & { readonly __brand: 'CourseId' };
export type MemberId = string & { readonly __brand: 'MemberId' };

export interface Course {
  id: CourseId;
  startsAt: Date;
  capacity: number;
}

export interface Booking {
  courseId: CourseId;
  memberId: MemberId;
  createdAt: Date;
}

export type BookingDecision =
  | { kind: 'accepted'; booking: Booking }
  | { kind: 'course_full' }
  | { kind: 'too_late' }
  | { kind: 'already_booked' };

export function decideBooking(
  course: Course,
  existing: readonly Booking[],
  memberId: MemberId,
  now: Date,
): BookingDecision;
```

Note sulle scelte:
- I tipi *branded* (marcati) per gli id evitano di scambiare un `memberId` con un `courseId` per errore (`buona pratica`).
- Il campo `kind` permette al caso d'uso e alla route di gestire ogni esito con uno `switch` esaustivo. TypeScript ti avvisa se ne dimentichi uno (`buona pratica`).
- Il nome `decideBooking` dice che la funzione *decide* e non salva: il salvataggio resta in `application/`.

La finestra di tempo per "fuori tempo" (quante ore prima dell'inizio) conviene passarla come costante o come campo del corso, non scriverla nel corpo della funzione.

**Domanda:** quando il corso è pieno, la richiesta viene solo rifiutata oppure entra in una lista d'attesa? Nel secondo caso `BookingDecision` ha bisogno di una variante in più, e cambia anche come modelli la cancellazione.
