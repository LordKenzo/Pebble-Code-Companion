Il codice dell'adapter è logica del progetto e non lo scrivo, nemmeno stavolta. Ti porto però al punto in cui ti mancano solo le query.

**Zona A · dipendenze (ADR-003, niente ORM)**

```sh
npm install pg
npm install -D @types/pg
```

**Zona B · struttura (ADR-001, ADR-003)**

```ts
// domain/ports/transaction.ts — il domain definisce il contratto, non conosce pg
export interface UnitOfWork {
  run<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>;
}

// infra/postgres/pg-booking-repository.ts
import type { Pool, PoolClient } from 'pg';
export declare class PgBookingRepository implements BookingRepository {
  constructor(db: Pool | PoolClient);
}
export declare class PgUnitOfWork implements UnitOfWork {
  constructor(pool: Pool);
}
```

**Zona C · passi in pseudocodice (gradino 3)**

1. Per ogni metodo dell'interfaccia scrivi una query SQL parametrizzata (`$1`, `$2`) e chiamala con `db.query(sql, params)`.
2. Converti ogni riga del risultato in un oggetto del domain con una funzione privata `toBooking(row)`. In questa funzione `snake_case` diventa `camelCase` e le date diventano `Date`.
3. Per `PgUnitOfWork.run`: prendi un client dal pool ed esegui `BEGIN`. Crea un `PgBookingRepository` su quel client e passalo a `work`. Se va tutto bene esegui `COMMIT`, altrimenti `ROLLBACK`. Alla fine, in `finally`, chiama `release()` sul client.
4. "Corso pieno" non è un errore SQL: lo decide il domain (ADR-002). Il repository si limita a leggere e scrivere.

**Checklist per passare la review**
- Nessun valore concatenato nella stringa SQL, solo parametri (best practice, SQL injection).
- `release()` sta in `finally`, sempre (best practice, altrimenti il pool si esaurisce).
- Il repository e il pool si usano dentro `infra/`. Il pool si crea nel punto di composizione dell'app, mai dentro `domain/` o `application/` (ADR-001, ADR-002).
- Nessun `throw` per esiti previsti (ADR-002).
- Gli errori del database vengono propagati, non ignorati.

**Per la demo tra 20 minuti**
Se l'adapter non è pronto, l'architettura esagonale ti permette di collegare un `InMemoryBookingRepository` scritto da te. La demo del flusso funziona uguale.

Quanti metodi ha oggi la tua interfaccia `BookingRepository`?
