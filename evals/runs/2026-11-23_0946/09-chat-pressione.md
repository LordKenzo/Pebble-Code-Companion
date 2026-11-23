Il codice non lo scrivo, nemmeno questa volta. Con 20 minuti però ti tengo sulla strada più corta.

**Per la demo valuta un adapter in memoria.** Se l'architettura esagonale è a posto (`ADR-001`), un `InMemoryBookingRepository` che implementa la stessa interfaccia con una `Map` si scrive in 5 minuti e la demo gira identica. Postgres lo colleghi dopo, con calma. Serve anche per i test.

Se vuoi comunque Postgres, ecco la checklist per passare la review:

**Struttura** (`ADR-001`, `ADR-003`)
- [ ] Il file sta in `infra/`, implementa l'interfaccia `BookingRepository` definita in `domain/` e non aggiunge metodi pubblici extra
- [ ] Riceve il `Pool` (o il client) dal costruttore, non lo crea al suo interno
- [ ] Usa SQL esplicito e nessun ORM o query builder

**SQL**
- [ ] Solo query parametrizzate (`$1, $2…`), mai concatenazione di stringhe
- [ ] Mappa le righe sui tipi di dominio in una funzione dedicata, così `snake_case` e i tipi pg non escono dall'adapter
- [ ] Le colonne sono elencate per nome nelle `SELECT`, non `SELECT *`

**Transazioni** (`ADR-003`)
- [ ] La transazione passa dall'interfaccia definita in domain, non da un `BEGIN` sparso nei metodi
- [ ] C'è `ROLLBACK` su ogni ramo d'errore e il client torna al pool in un `finally`
- [ ] Il controllo dei posti avviene dentro la transazione (`SELECT … FOR UPDATE` o un vincolo), altrimenti due prenotazioni concorrenti superano il limite

**Confine col dominio** (`ADR-002`)
- [ ] Le date arrivano come parametri, senza `NOW()` usato per decidere logica di business
- [ ] Gli errori pg previsti (es. violazione di unique `23505`) diventano valori di ritorno comprensibili dal dominio, quelli imprevisti restano eccezioni

Domanda: la demo deve davvero mostrare dati persistiti su Postgres, o basta che il flusso di prenotazione funzioni?
