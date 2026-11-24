Non te lo scrivo: l'adapter è logica del progetto, anche se è codice di collegamento. Però ti tolgo tutto il resto, così in 20 minuti scrivi solo le query.

**1 · Dipendenze** (`buona pratica`)

```sh
npm install pg
npm install -D @types/pg
```

```sh
# .env, da non committare: aggiungi .env al .gitignore
DATABASE_URL=postgres://utente:password@localhost:5432/palestra
```

**2 · Scheletro** (`ADR-001`, `ADR-003`): l'adapter sta in `infra/`, implementa la porta del dominio e riceve il `Pool` dall'esterno.

```ts
// infra/postgres/PgBookingRepository.ts
import type { Pool, PoolClient } from 'pg';
import type { BookingRepository } from '../../domain/BookingRepository';

export class PgBookingRepository implements BookingRepository {
  constructor(private readonly pool: Pool) {}
  // un metodo per ogni metodo dell'interfaccia BookingRepository
  private toDomain(row: BookingRow): Booking;
}

interface BookingRow {
  id: string;
  course_id: string;
  member_id: string;
  created_at: Date;
}
```

**3 · Passi in pseudocodice per il salvataggio con transazione** (gradino 3, `ADR-003`):
1. Prendi un client dal pool con `connect()`.
2. Esegui `BEGIN`.
3. Leggi il corso con `SELECT … FOR UPDATE`, così due prenotazioni simultanee non superano i posti.
4. Esegui l'`INSERT` con parametri posizionali `$1, $2`.
5. Esegui `COMMIT`. Se qualcosa fallisce, esegui `ROLLBACK` e rilancia l'errore.
6. Nel `finally` esegui sempre `release()`.

**Checklist per passare la review:**
- Le query usano solo parametri `$n`, mai stringhe concatenate (`buona pratica`, rischio di SQL injection).
- Nessun tipo di `pg` esce dall'adapter: verso il dominio passano solo oggetti di dominio, tramite `toDomain` (`ADR-002`).
- Corso pieno e fuori tempo li decide il dominio. L'adapter lancia eccezioni solo per guasti di I/O (`ADR-002`).
- Il client torna sempre al pool, anche in caso di errore.
- Le colonne in snake_case si mappano in camelCase in un solo punto.

Ti serve una sola cosa da me: qual è la firma dell'interfaccia di transazione che hai definito in `domain/`? Da quella dipende se `BEGIN` e `COMMIT` stanno dentro il repository o in un runner separato.
