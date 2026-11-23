# Prenota: impostazione iniziale

**Lettura del bootstrap.** Devi costruire un'API REST in Node e TypeScript su Postgres. Gli iscritti prenotano e cancellano i corsi, lo staff gestisce corsi e capienza. Il punto critico non è il CRUD ma la concorrenza: il lunedì alle 7:00 tante richieste arrivano insieme sugli stessi posti. Lì non devi mai superare la capienza, e la lista d'attesa deve restare coerente.

## Decisioni proposte

> **ADR-001: Moduli per dominio, a livelli**  
> Stato: proposto  
> Contesto: chiedi come strutturare le cartelle. Le regole (12 ore, capienza, lista d'attesa) vanno testate senza HTTP né database.  
> Decisione: due moduli, `courses` e `bookings`. Ognuno ha quattro livelli: `domain`, `application`, `infra` e `http`. Come framework HTTP si usa Fastify.  
> Alternative scartate: cartelle per tipo tecnico (`controllers/`, `services/`), perché sparpagliano una funzionalità in tutto il progetto. Express, perché ha validazione e tipi meno integrati.  
> Conseguenze: regole testabili in isolamento. In cambio servono un po' più di file e interfacce.

> **ADR-002: Query builder tipizzato (Kysely) al posto di un ORM**  
> Stato: proposto  
> Contesto: chiedi se usare un ORM. Ti servono transazioni esplicite e lock di riga (`SELECT … FOR UPDATE`).  
> Decisione: Kysely per le query tipizzate, con il suo migrator per le migrazioni SQL.  
> Alternative scartate:
> - Prisma, perché i lock di riga richiedono SQL grezzo e il client va generato.
> - TypeORM, perché decorator e lazy loading nascondono le query che contano.
> - `pg` puro, perché non dà tipi.
>
> Conseguenze: controlli esattamente l'SQL che gira nel momento di picco. In cambio scrivi a mano le relazioni.

> **ADR-003: Capienza protetta da lock pessimistico in transazione**  
> Stato: proposto  
> Contesto: al picco del lunedì due richieste possono leggere "1 posto libero" nello stesso istante.  
> Decisione: ogni prenotazione apre una transazione. Dentro blocca la riga del corso con `FOR UPDATE`, conta i confermati e poi inserisce come `confirmed` oppure `waitlisted`. In più, un vincolo `UNIQUE (course_id, member_id)` impedisce le doppie prenotazioni.  
> Alternative scartate:
> - Contatore ottimistico con retry, perché sotto picco produce tempeste di retry.
> - Coda o Redis, perché aggiungono infrastruttura prematura per questi volumi.
>
> Conseguenze: la correttezza è garantita dal database. Le richieste sullo stesso corso vengono servite una alla volta, cosa accettabile per uno studio fitness.

> **ADR-004: Promozione automatica dalla lista d'attesa**  
> Stato: proposto  
> Contesto: quando qualcuno cancella, il posto deve passare al primo in lista senza che si creino buchi.  
> Decisione: nella stessa transazione della cancellazione si promuove il primo `waitlisted`, scelto per `created_at`, con lo stesso lock dell'ADR-003.  
> Alternative scartate:
> - Promozione con conferma dell'iscritto, perché serve gestire una scadenza e un job.
> - Job asincrono, perché lascia finestre di incoerenza.
>
> Conseguenze: lo stato è sempre coerente. C'è però un caso da gestire: chi viene promosso meno di 12 ore prima del corso non può più cancellare gratis. Va deciso come trattarlo, e conviene registrarlo come regola esplicita.

> **ADR-005: Tempo in UTC e orologio iniettato**  
> Stato: proposto  
> Contesto: la regola delle 12 ore e l'apertura del lunedì dipendono dall'ora corrente.  
> Decisione: le date si salvano come `timestamptz`. Il dominio riceve un'interfaccia `Clock` e non chiama mai `new Date()` direttamente. I test si fanno con Vitest: test unitari sul dominio e test di integrazione su un Postgres reale in Docker.  
> Alternative scartate:
> - Ora locale nel database, perché il cambio dell'ora legale sposta la soglia delle 12 ore.
> - Mock del database, perché non verificano i lock.
>
> Conseguenze: i casi limite sono testabili, ad esempio 12h00m01s contro 11h59m59s. In cambio serve Docker in locale.

## Architettura

Le dipendenze vanno in una sola direzione: `http → application → domain`.

- `infra` implementa le interfacce (porte) definite in `application`.
- `domain` non importa né Kysely né Fastify (ADR-001).
- `shared` contiene solo strumenti trasversali.

```
src/
  modules/
    courses/
      domain/        regole di corso e capienza
      application/   casi d'uso dello staff e porte (repository)
      infra/         repository Kysely
      http/          route Fastify e schemi di validazione
    bookings/
      domain/        regole di prenotazione, 12 ore, lista d'attesa
      application/   prenota, cancella, promuovi; porte
      infra/         repository con transazioni e lock
      http/          route degli iscritti
  shared/
    db/              connessione Kysely e tipi delle tabelle
    clock/           interfaccia Clock e implementazione di sistema
    errors/          errori di dominio e mappatura in HTTP
migrations/          migrazioni SQL versionate
test/
  integration/       test su Postgres reale, inclusa la concorrenza
```

## Roadmap

1. **Setup.** Il progetto compila, Postgres gira in Docker e un test Vitest passa.
2. **Schema e migrazioni.** Tabelle `courses`, `members`, `bookings` con il vincolo UNIQUE. `npm run migrate` va a buon fine su un database vuoto.
3. **Dominio di `bookings`.** La regola delle 12 ore e la decisione tra confermato e lista d'attesa, coperte da test unitari con un `Clock` finto.
4. **Caso d'uso "prenota".** Implementato con transazione e lock. Un test di integrazione lancia 20 prenotazioni parallele su 10 posti: risultato atteso 10 confermati e 10 in lista.
5. **Caso d'uso "cancella" con promozione.** Un test verifica che dopo la cancellazione il primo in lista risulti confermato.
6. **Gestione corsi per lo staff.** Creazione e modifica della capienza. Va deciso cosa succede se la capienza scende sotto il numero di confermati.
7. **API HTTP.** Route, validazione e mappatura degli errori, verificate con test tramite `fastify.inject`.

## Da dove partire

Comincia dal passo 1, il setup. Ti serve per avere un ciclo test-verde funzionante prima di toccare qualsiasi regola, così ogni passo successivo si verifica in pochi secondi.

```sh
git init
npm init -y
npm install fastify kysely pg
npm install -D typescript tsx vitest @types/node @types/pg
npx tsc --init
docker run --name prenota-db -e POSTGRES_PASSWORD=prenota -e POSTGRES_DB=prenota -p 5432:5432 -d postgres:17
```

Cosa installa ciascun pacchetto:

- `tsx` esegue i file TypeScript in sviluppo senza un passo di build.
- `vitest` è il test runner previsto dall'ADR-005.
- `postgres:17` è l'immagine del database per i test di integrazione, sempre ADR-005.

Quando hai il setup pronto, chiedimi `NEW_FILE` su `package.json` e `tsconfig.json`: ti preparo script e opzioni strict complete.
