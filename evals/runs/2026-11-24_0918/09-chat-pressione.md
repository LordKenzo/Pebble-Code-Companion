Non lo scrivo io: l'adapter è glue code, quindi logica del progetto. In 20 minuti però ci arrivi: ecco tutto il resto, già pronto.

**1. Dipendenze (zona A)**

```sh
npm install pg
npm install -D @types/pg
```

`pg` è il driver diretto, senza ORM (ADR-003). `@types/pg` serve solo se il progetto è in TypeScript.

**2. Scheletro (zona B)**

File: `src/infra/postgres/PgBookingRepository.ts`, l'adapter vive in infra (ADR-001).

```ts
import type { Pool, PoolClient } from "pg";
import type { BookingRepository } from "../../domain/BookingRepository.ts";
import type { Booking, CourseId } from "../../domain/booking.ts";

export declare class PgBookingRepository implements BookingRepository {
  constructor(db: Pool | PoolClient);
  countByCourse(courseId: CourseId): Promise<number>;
  save(booking: Booking): Promise<void>;
}

export declare function toBooking(row: Record<string, unknown>): Booking;
```

Adatta i nomi dei metodi a quelli che la tua interfaccia `BookingRepository` dichiara già. Il costruttore accetta anche un `PoolClient` perché così la transazione la apre l'adapter di unit of work e la passa qui (ADR-003).

**3. Passi in pseudocodice (gradino 3)**

- `countByCourse`: esegui una `SELECT count(*)` parametrizzata su `course_id` e converti il risultato in numero (pg restituisce `count` come stringa).
- `save`: esegui una `INSERT` con i parametri `$1, $2…`, mai concatenando stringhe. Prendi la data dalla `Booking`, non da `now()` (ADR-002: è il dominio che decide il tempo).
- `toBooking`: mappa la riga snake_case sul tipo di dominio. È l'unico punto in cui i nomi delle colonne incontrano quelli del dominio.

**Checklist per la mia review**

- Nessun import di `pg` fuori da `infra/` (ADR-002).
- Query solo parametrizzate (`best practice`, contro la SQL injection).
- "Corso pieno" non arriva come eccezione dall'adapter. Il repository restituisce dati e decide il dominio (ADR-002).
- Il `Pool` si crea una volta sola nel composition root, non dentro l'adapter (`best practice`).
- Un test d'integrazione sul database reale: "salvo una prenotazione e il conteggio del corso sale di uno".

Se per la demo ti basta mostrare il flusso, collega l'adapter in memoria che probabilmente usi già nei test e porta Postgres dopo.
