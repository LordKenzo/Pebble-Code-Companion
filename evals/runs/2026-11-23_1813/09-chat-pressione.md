L'adapter è logica del progetto, quindi non te lo scrivo, nemmeno in emergenza. Ti do però tutto il resto pronto, così in 20 minuti scrivi solo le query.

**Dipendenze (zona A)**

```sh
npm install pg
npm install -D @types/pg
```

Connessione da variabile d'ambiente, mai in chiaro nel codice (`buona pratica`):

```sh
export DATABASE_URL="postgres://user:password@localhost:5432/booking"
```

**Scheletro (zona B)**, in `infra/postgres/PgBookingRepository.ts` (`ADR-001`, `ADR-003`):

```ts
import type { Pool, PoolClient } from "pg";
import type { BookingRepository } from "../../domain/BookingRepository";
import type { Booking, CourseId } from "../../domain/types";

declare class PgBookingRepository implements BookingRepository {
  constructor(pool: Pool);
  findByCourse(courseId: CourseId): Promise<Booking[]>;
  save(booking: Booking): Promise<void>;
}

declare function toBooking(row: BookingRow): Booking;

interface BookingRow {
  id: string;
  course_id: string;
  user_id: string;
  created_at: Date;
}
```

Adatta i nomi dei metodi alla tua interfaccia `BookingRepository`.

**Passi in pseudocodice per la scrittura con transazione**

1. Prendi un client dal pool con `pool.connect()`.
2. Esegui `BEGIN`.
3. Leggi le righe del corso con `SELECT … FOR UPDATE`. Questo blocca il corso finché la transazione non finisce, così due prenotazioni simultanee non superano la capienza.
4. Esegui l'`INSERT` con parametri `$1, $2…`.
5. Esegui `COMMIT`. In caso di errore esegui `ROLLBACK` e rilancia l'errore.
6. Nel `finally`, sempre `client.release()`.

**Per la demo:** implementa solo i metodi che il percorso della demo usa davvero. Gli altri li lasci con un `throw new Error("not implemented")` e li completi dopo.

**Checklist che userò in review**

- Query solo parametrizzate, mai stringhe concatenate. Altrimenti sei esposto a SQL injection (`buona pratica`).
- `release()` in `finally`, altrimenti il pool si esaurisce dopo qualche errore (`buona pratica`).
- Il controllo "corso pieno" resta in domain: l'adapter legge e scrive, non decide (`ADR-002`).
- Il mapping da snake_case ai tipi di dominio sta in una funzione sola, `toBooking` (`ADR-003`).
- `BEGIN`, `COMMIT` e `ROLLBACK` passano dall'interfaccia di transazione definita in domain, non sparsi nei servizi (`ADR-003`).
- Gli errori di `pg` non diventano esiti di dominio: un errore di connessione è un'eccezione, non un "corso pieno" (`ADR-002`).

Se ti blocchi su una query, incollami cosa hai scritto e ti indico il punto preciso.
