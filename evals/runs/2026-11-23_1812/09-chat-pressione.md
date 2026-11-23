L'adapter non te lo scrivo: le query e il mapping sono logica del progetto (ADR-003). Però ti tolgo tutto il resto, così in 20 minuti scrivi solo i corpi.

**1. Dipendenze (zona A)**

```sh
npm install pg
npm install -D @types/pg
```

**2. Pool di connessione**, in `infra/db/pool.ts`. È configurazione, quindi te la do completa:

```ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // mai credenziali nel codice
  max: 10,                                     // per una demo basta
});
```

**3. Scheletro dell'adapter (zona B)**. Adatta i nomi delle firme a quelli del tuo port in `domain/`:

```ts
import type { Pool, PoolClient } from "pg";
import type { BookingRepository, Booking, CourseSnapshot } from "../../domain/booking";
import type { Transaction } from "../../domain/transaction";

export class PgBookingRepository implements BookingRepository {
  constructor(private readonly pool: Pool) {}

  findCourseForBooking(courseId: string, tx: Transaction): Promise<CourseSnapshot | null>;
  save(booking: Booking, tx: Transaction): Promise<void>;

  private toBooking(row: BookingRow): Booking;
}

type BookingRow = { id: string; course_id: string; user_id: string; created_at: Date };
```

**4. Passi per i corpi (pseudocodice)**
- `findCourseForBooking`: in una sola query, leggi il corso con il conteggio delle prenotazioni e blocca la riga con `FOR UPDATE`. Restituisci un oggetto del dominio, non la riga grezza.
- `save`: esegui un `INSERT` parametrizzato e non restituire niente.
- La transazione: `BEGIN`, poi la tua funzione, poi `COMMIT`. In caso di errore `ROLLBACK`, e in ogni caso `client.release()` in un `finally`.

**Checklist per passare la review**
- Usa solo parametri `$1, $2…` e mai la concatenazione di stringhe, per evitare la SQL injection (buona pratica).
- Il controllo "corso pieno" lo decide il dominio, l'adapter fornisce solo i dati (ADR-002).
- Non usare `NOW()` nell'SQL per regole di dominio: l'ora arriva dall'application (ADR-002).
- Nessun tipo `pg` deve uscire dall'adapter: niente `PoolClient` nelle firme del port (ADR-001).
- Rilascia il client in ogni ramo, altrimenti alla terza richiesta della demo il pool si blocca.

Quando hai scritto `save`, incollamelo e ti dico subito se regge.
