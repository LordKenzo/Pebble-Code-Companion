**Ruolo**
Il cuore delle regole di prenotazione. Livello `domain`, quindi puro: riceve dati, restituisce un esito. Tutti gli altri livelli dipendono da lui, e lui da nessuno (ADR-001).

**Deve**
- Definire i tipi del dominio: `Course`, `Booking` e gli identificativi (ADR-002).
- Decidere se una prenotazione è ammessa, partendo da corso, prenotazioni esistenti e istante corrente passato come parametro (ADR-002).
- Modellare gli esiti previsti, cioè corso pieno, fuori tempo e già prenotato, come unione discriminata di valori di ritorno (ADR-002).
- Fare lo stesso per la cancellazione, se ha una regola di tempo.

**Non deve**
- Importare `pg`, `fastify`, `fs` o `fetch` (ADR-002).
- Chiamare `new Date()` o `Date.now()`: l'istante arriva da `application`, che lo prende dall'orologio in `infra/` (ADR-002).
- Lanciare eccezioni per corso pieno o fuori tempo. Le eccezioni restano per gli invarianti violati, cioè i bug (ADR-002).
- Contenere l'interfaccia delle transazioni. Va in un file separato, `src/domain/ports.ts`, così `booking.ts` resta solo regole (ADR-003, `best practice`).

**Punto di partenza**

```ts
export type CourseId = string & { readonly __brand: 'CourseId' };
export type MemberId = string & { readonly __brand: 'MemberId' };

export interface Course { id: CourseId; capacity: number; startsAt: Date; }
export interface Booking { courseId: CourseId; memberId: MemberId; bookedAt: Date; }

export type BookingOutcome =
  | { kind: 'confermata'; booking: Booking }
  | { kind: 'corso-pieno' }
  | { kind: 'fuori-tempo' }
  | { kind: 'gia-prenotato' };

export declare function valutaPrenotazione(
  course: Course,
  existing: readonly Booking[],
  memberId: MemberId,
  now: Date,
): BookingOutcome;
```

Note sulle scelte:
- I tipi *branded* (`CourseId`, `MemberId`) impediscono di scambiare un id corso con un id iscritto (`best practice`).
- `kind` permette a `application` e `http` di gestire ogni esito con uno `switch` esaustivo, controllato dal compilatore (`best practice`).
- Quando la regola di cancellazione è chiara, aggiungi `valutaCancellazione` con un suo `CancellationOutcome`, sullo stesso schema.

**Domanda:** cosa significa esattamente "fuori tempo"? Per esempio, si può prenotare fino a N ore prima dell'inizio? È la regola che decide quali campi servono a `Course` (solo `startsAt`, oppure anche una finestra di apertura).
