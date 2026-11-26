Sei in modalità training, quindi l'adapter (logica di collegamento, zona C) non lo scrivo nemmeno stavolta. Ti do però tutto il resto, così in 20 minuti ce la fai.

**Dipendenze** (`best practice`)

```sh
npm install pg
npm install -D @types/pg
```

**Struttura** (ADR-001, ADR-003). Adatta i nomi dei metodi alla tua interfaccia `BookingRepository` in `domain/`.

```ts
// infra/postgres/PgBookingRepository.ts
import type { Pool, PoolClient } from "pg";
import type { BookingRepository, Booking, BookingId, CourseId } from "../../domain/booking";

export declare class PgBookingRepository implements BookingRepository {
  constructor(db: Pool | PoolClient);
  findById(id: BookingId): Promise<Booking | null>;
  countByCourse(courseId: CourseId): Promise<number>;
  save(booking: Booking): Promise<void>;
}

// infra/postgres/PgTransaction.ts: implementa l'interfaccia di transazione definita in domain
export declare class PgTransaction {
  constructor(pool: Pool);
  run<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>;
}
```

**Pseudocodice di `run`** (ADR-003)
- Prendi un client dal pool.
- Apri la transazione e crea un `PgBookingRepository` su quel client, non sul pool.
- Esegui `work`. Se va bene fai commit, se fallisce fai rollback e rilancia l'errore.
- In ogni caso rilascia il client.

Lo scheletro su cui partire:
```ts
await client.query("BEGIN");
// ... work(new PgBookingRepository(client)) → COMMIT / ROLLBACK
client.release(); // in finally
```

**Checklist per passare la review**
- Le query sono parametrizzate (`$1`, `$2`) e non c'è mai concatenazione di stringhe, così eviti la SQL injection (`best practice`).
- C'è un mapping esplicito riga → `Booking`, così da `infra` non escono nomi di colonna snake_case (ADR-001).
- "Corso pieno" non è un'eccezione dell'adapter. Lo decide il dominio in base al conteggio (ADR-002).
- `release()` sta in `finally`, altrimenti alla prima query fallita il pool si esaurisce (`best practice`).
- Per il controllo dei posti usi `SELECT … FOR UPDATE` sul corso, perché due prenotazioni simultanee potrebbero superare il limite (`best practice`).

**Gradino 1 · Domanda**
Se due utenti prenotano l'ultimo posto nello stesso millisecondo, ognuno dentro la sua transazione, quale valore leggono entrambi da `countByCourse`?
