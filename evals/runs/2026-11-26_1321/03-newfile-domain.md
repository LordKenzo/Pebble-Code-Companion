**Ruolo**
`booking.ts` contiene le regole della prenotazione: dato un corso, le prenotazioni esistenti e l'istante attuale, decide l'esito. Appartiene al livello **domain**, il centro verso cui puntano tutte le dipendenze (ADR-001).

**Deve**
- Definire i tipi del dominio: `Course`, `Booking` e l'esito della prenotazione (ADR-002).
- Decidere se una prenotazione è valida: posti disponibili, finestra temporale, doppia prenotazione dello stesso iscritto.
- Restituire gli esiti previsti come valori di un'unione discriminata, non come eccezioni (ADR-002).
- Ricevere `now` come parametro, così le regole sul tempo si testano senza mock (ADR-002).

**Non deve**
- Importare `pg`, `fastify`, `fs`, `fetch` o qualunque altra libreria di I/O (ADR-002).
- Chiamare `new Date()` o `Date.now()`: l'orologio è un adapter in `infra/` (ADR-002).
- Contenere SQL o sapere come si salva una prenotazione (ADR-003).
- Orchestrare il flusso "leggi, decidi, salva": quello è il caso d'uso in `application/` (ADR-001).

**Punto di partenza**

```ts
export type CourseId = string & { readonly __brand: 'CourseId' };
export type MemberId = string & { readonly __brand: 'MemberId' };

export interface Course {
  readonly id: CourseId;
  readonly capacity: number;
  readonly startsAt: Date;
  readonly closesMinutesBefore: number;
}

export interface Booking {
  readonly courseId: CourseId;
  readonly memberId: MemberId;
  readonly bookedAt: Date;
}

export type BookingOutcome =
  | { readonly kind: 'confermata'; readonly booking: Booking }
  | { readonly kind: 'corso_pieno' }
  | { readonly kind: 'fuori_tempo' }
  | { readonly kind: 'gia_prenotato' };

export declare function book(course: Course, existing: readonly Booking[], member: MemberId, now: Date): BookingOutcome;
```

I tipi "brandizzati" (`CourseId`, `MemberId`) impediscono di passare un id dell'iscritto dove serve quello del corso, anche se entrambi sono stringhe (`best practice`).

L'interfaccia per repository e transazioni richiesta da ADR-003 va in un file separato, `src/domain/ports.ts`, così `booking.ts` resta fatto solo di regole e tipi (`best practice`).

Prima di passare all'implementazione mi serve un'informazione: anche la cancellazione ha una scadenza o delle regole proprie da mettere in questo file, oppure `booking.ts` copre solo la prenotazione?
