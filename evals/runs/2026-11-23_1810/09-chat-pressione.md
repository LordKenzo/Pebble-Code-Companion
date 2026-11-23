L'adapter non te lo scrivo nemmeno stavolta, ma ti porto il più vicino possibile al traguardo, così in 20 minuti lo chiudi tu.

**1. Dipendenze** (zona A)

```sh
npm install pg
npm install -D @types/pg
```

**2. Struttura** (zona B · ADR-001, ADR-003)

```
src/infra/postgres/
  pool.ts                   # crea e esporta il Pool, legge DATABASE_URL
  pg-transaction.ts         # implementa l'interfaccia di transazione definita in domain
  pg-booking-repository.ts  # implementa BookingRepository con SQL esplicito
```

```ts
export class PgBookingRepository implements BookingRepository {
  constructor(private readonly db: Pool | PoolClient) {}
  // un metodo per ogni metodo della porta, stesse firme del domain
}

export class PgTransactionRunner implements TransactionRunner {
  constructor(private readonly pool: Pool) {}
  run<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>;
}
```

Adatta i nomi a quelli della tua interfaccia in `domain/`: l'adapter si adegua alla porta, mai il contrario.

**3. Passi in pseudocodice** (zona C, gradino 3)

Per `run`: prendi un client dal pool, esegui `BEGIN`, crea un `PgBookingRepository` legato a quel client e passalo a `work`. Se va bene fai `COMMIT`, se lancia fai `ROLLBACK` e rilancia. In ogni caso, nel `finally`, rilascia il client.

Per la prenotazione: leggi il corso con `SELECT … FOR UPDATE` dentro la transazione, così due richieste concorrenti non superano entrambe il controllo sui posti. Poi inserisci la prenotazione. Ogni riga letta va mappata nel tipo del domain prima di restituirla.

**Checklist per passare la review**

- Nessun import di `pg` fuori da `infra/` (ADR-002).
- Solo query parametrizzate (`$1, $2`), mai valori concatenati nella stringa SQL (`buona pratica`, rischio di SQL injection).
- Il client torna sempre al pool con `release()` nel `finally`, altrimenti dopo poche richieste il pool si esaurisce (`buona pratica`).
- L'adapter restituisce tipi del domain, non righe `pg` grezze (ADR-001).
- Corso pieno e fuori tempo li decide il domain e restano valori di ritorno. L'adapter lancia eccezioni solo per guasti veri, come una connessione caduta (ADR-002).
- Le date arrivano dal chiamante: nessun `NOW()` usato per decidere le regole di dominio (ADR-002).

Se ti blocchi su un metodo preciso, incollalo e ti indico la riga da correggere.
