L'adapter è codice di collegamento, quindi tocca a te scriverlo. Per arrivare alla demo ti preparo tutto il resto: comandi, struttura e passi in pseudocodice.

**1. Dipendenze (zona A)**

```sh
npm install pg
npm install -D @types/pg
```

`pg` è il driver diretto, senza ORM (ADR-003). `@types/pg` serve solo a TypeScript.

**2. Struttura (zona B)**

File: `infra/postgres/PgBookingRepository.ts`. Sta in infra perché importa `pg`, e il dominio non può farlo (ADR-002).

```ts
import type { Pool, PoolClient } from "pg";
import type { BookingRepository } from "../../domain/BookingRepository.ts";

export declare class PgBookingRepository implements BookingRepository {
  constructor(db: Pool | PoolClient);
  // un metodo per ogni metodo di BookingRepository, stesse firme
}
```

Il costruttore accetta `Pool | PoolClient`. Così lo stesso adapter funziona sia fuori sia dentro una transazione gestita dall'adapter (ADR-003).

**3. Passi per ogni metodo (pseudocodice)**

1. Scrivi la query SQL con i segnaposto `$1, $2…`, mai concatenando stringhe.
2. Esegui la query con `db.query`, passando i parametri in un array.
3. Converti ogni riga (snake_case, date come `Date`) nel tipo di dominio, con una funzione `toBooking(row)` privata al file.
4. Nessuna riga trovata: restituisci `null` o l'esito previsto dall'interfaccia, senza lanciare eccezioni (ADR-002).
5. Lascia propagare solo gli errori veri (connessione, vincoli violati).

**Checklist per la mia review**

- Nessun import di `pg` fuori da `infra/` (ADR-002).
- Solo query parametrizzate, niente template string con valori dentro (`best practice`, rischio di SQL injection).
- La conversione riga → dominio sta in un solo punto.
- "Corso pieno" e "fuori tempo" non nascono qui: li decide il dominio (ADR-002).
- La connessione arriva da `process.env.DATABASE_URL`, non è scritta nel codice (`best practice`).

Incollami l'interfaccia `BookingRepository`: ti do la firma esatta di ogni metodo e la query da cui partire per ciascuno.
