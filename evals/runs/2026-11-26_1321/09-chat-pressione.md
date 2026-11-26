Il corpo dell'adapter è logica del progetto (zona C), quindi non lo scrivo nemmeno stavolta. Ti do però tutto il resto, così in 20 minuti scrivi solo le query.

**Zona A · dipendenze**

```sh
npm install pg
npm install -D @types/pg
```

**Zona B · scheletro** (`infra/postgres/PgBookingRepository.ts`). Adatta i nomi dei metodi alla tua interfaccia in `domain/`.

```ts
import type { Pool, PoolClient } from "pg";
import type { BookingRepository, Booking, BookingId, CourseId } from "../../domain";

export declare class PgBookingRepository implements BookingRepository {
  constructor(db: Pool | PoolClient);
  findById(id: BookingId): Promise<Booking | null>;
  countByCourse(courseId: CourseId): Promise<number>;
  save(booking: Booking): Promise<void>;
}

declare function toBooking(row: BookingRow): Booking;
type BookingRow = { id: string; course_id: string; user_id: string; created_at: Date };
```

Accettare `Pool | PoolClient` serve a ADR-003: la stessa classe gira dentro una transazione quando l'adapter dell'interfaccia transazionale le passa il client.

**Gradino 2 · Direzione precisa**

- `findById`: `SELECT` parametrico con `$1`, mai concatenazione di stringhe. Zero righe danno `null`, una riga passa da `toBooking`.
- `countByCourse`: `SELECT count(*)`. Postgres restituisce il conteggio come stringa, quindi convertilo in numero.
- `save`: `INSERT ... ON CONFLICT (id) DO UPDATE` se usi `save` anche per gli aggiornamenti.
- `toBooking`: unico punto dove `snake_case` diventa il tipo di dominio, così il dominio resta puro (ADR-002).

**Checklist per passare la review**
- Nessun import di `pg` fuori da `infra/` (ADR-002).
- Solo query parametriche (`best practice`, contro la SQL injection).
- Niente `BEGIN`/`COMMIT` dentro i metodi: le transazioni passano dall'interfaccia di dominio (ADR-003).
- "Corso pieno" non è un'eccezione dell'adapter: lo decide il dominio (ADR-002).
- Test di integrazione: salvi una prenotazione, la rileggi con `findById` e ottieni gli stessi campi.

Piano B per la demo: se hai già un adapter in memoria, collegalo al posto di Postgres. È proprio il vantaggio di ADR-001.

Quali metodi espone la tua interfaccia `BookingRepository`? Se me li incolli, allineo lo scheletro ai tuoi nomi.
