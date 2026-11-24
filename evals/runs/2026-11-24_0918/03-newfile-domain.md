**Ruolo**
Il cuore delle regole di prenotazione: decide se una prenotazione è valida. Appartiene al livello `domain/` ed è puro: riceve dati, restituisce un esito (ADR-001, ADR-002).

**Deve**
- Definire i tipi del dominio: corso, prenotazione, identificativi (ADR-001).
- Decidere l'esito di una richiesta di prenotazione: accettata, corso pieno o fuori tempo (ADR-002).
- Restituire gli esiti previsti come valori di un'unione discriminata, non come eccezioni (ADR-002).
- Ricevere "adesso" come parametro `now: Date`, così i test fissano l'ora senza mock (ADR-002).

**Non deve**
- Importare `pg`, `fastify`, `fetch` o `fs` (ADR-002).
- Chiamare `new Date()` o `Date.now()` al suo interno. L'orologio vive in `infra/` e il caso d'uso in `application/` lo passa qui (ADR-002, architettura).
- Contenere SQL o la gestione delle transazioni. L'interfaccia della transazione va in un file a parte, per esempio `src/domain/ports.ts`, e l'adapter in `infra/` la implementa (ADR-003).
- Lanciare eccezioni per "corso pieno" o "fuori tempo". Le eccezioni sono per gli errori imprevisti, come dati incoerenti (ADR-002).

**Punto di partenza**

```ts
export type CourseId = string;
export type MemberId = string;

export interface Course {
  id: CourseId;
  capacity: number;
  bookedCount: number;
  startsAt: Date;
}

export interface Booking {
  courseId: CourseId;
  memberId: MemberId;
  createdAt: Date;
}

export type BookingOutcome =
  | { kind: "prenotato"; booking: Booking }
  | { kind: "corso_pieno" }
  | { kind: "fuori_tempo" };

export declare function book(course: Course, memberId: MemberId, now: Date): BookingOutcome;
```

Con `kind` come discriminante, il caso d'uso in `application/` e la route in `http/` possono fare uno `switch` esaustivo. TypeScript ti segnala ogni esito non gestito (best practice). Il finestra di chiusura delle prenotazioni sarà una costante esportata dallo stesso file, con il valore preso dal bootstrap.

Quanto prima dell'inizio del corso si chiudono le prenotazioni? La risposta decide se `book` ha bisogno anche di una regola sulla finestra o se basta confrontare `now` con `startsAt`.
