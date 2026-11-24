L'adapter è logica del progetto e non lo scrivo io, neanche questa volta. In 20 minuti però ce la fai, se ti tolgo tutto il resto.

**Dipendenze** (zona A)

```sh
npm install pg
npm install -D @types/pg
```

`pg` è il driver Postgres. Per ADR-003 non serve altro: niente ORM, niente query builder.

**Scheletro** (zona B), in `infra/postgres/PgBookingRepository.ts`

```ts
import { Pool, type PoolClient } from "pg";
import type { BookingRepository } from "../../domain/BookingRepository.ts";

export class PgBookingRepository implements BookingRepository {
  constructor(pool: Pool);
  // un metodo per ogni metodo di BookingRepository, stesse firme
}
```

Se la porta delle transazioni (ADR-003) non esiste ancora in `domain/`, per la demo puoi rimandarla. Nel caso, segnalo come debito.

**I passi per ogni metodo** (zona C, in pseudocodice)

1. Prendi un client dal pool, oppure usa quello della transazione corrente se c'è.
2. Esegui una query SQL esplicita con parametri `$1, $2…`. Non concatenare mai le stringhe.
3. Converti le righe (`snake_case`, date come `Date`) negli oggetti del dominio, in una funzione privata `toBooking(row)`.
4. Se una query non trova righe, restituisci `null`/`undefined`, come dice la firma della porta. Non lanciare eccezioni.
5. Nelle scritture con controllo di capienza, fai `SELECT … FOR UPDATE` e la scrittura nella stessa transazione, poi `COMMIT`. In caso di errore fai `ROLLBACK` e rilascia il client nel `finally`.

**Checklist per passare la review dopo la demo**

- Nessun import da `infra/` dentro `domain/` (ADR-001, ADR-002).
- Solo query parametrizzate (`buona pratica`, sicurezza).
- "Corso pieno" e "fuori tempo" li decide il dominio. L'adapter salva e legge e basta (ADR-002).
- `client.release()` sempre nel `finally` (`buona pratica`, altrimenti il pool si esaurisce).
- La connessione arriva da `DATABASE_URL`, mai scritta nel codice (`buona pratica`).

Consiglio da demo: implementa solo i metodi che il flusso mostrato usa davvero. Gli altri possono lanciare `new Error("not implemented")`.
