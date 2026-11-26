## Lettura del bootstrap

Un'API REST per uno studio fitness. Gli iscritti prenotano e cancellano, lo staff gestisce corsi e capienza. Le regole di dominio sono tre: cancellazione gratuita fino a 12 ore prima, lista d'attesa a corso pieno, picco concorrente il lunedì alle 7:00. Il rischio vero è l'ultimo punto: due prenotazioni simultanee sull'ultimo posto non devono mai superare la capienza.

## Decisioni proposte

> **ADR-001: Fastify come framework HTTP**  
> Stato: proposta  
> Contesto: serve un framework HTTP per Node + TypeScript (bootstrap › Vincoli) che regga il picco del lunedì.  
> Decisione: Fastify, con la validazione degli input tramite JSON Schema/TypeBox.  
> Alternative scartate: Express, perché è più lento, ha una tipizzazione debole e non valida gli input nativamente. NestJS, perché porta molta struttura e magia in un progetto piccolo.  
> Conseguenze: route tipizzate e validate al confine. Si impara il sistema di plugin di Fastify.

> **ADR-002: Kysely come query builder, niente ORM**  
> Stato: proposta  
> Contesto: risponde a "Se usare un ORM". La parte critica è il controllo della capienza, che richiede transazioni e lock espliciti.  
> Decisione: Kysely sopra `pg`. Le migrazioni si fanno con il migrator di Kysely, in SQL leggibile.  
> Alternative scartate: Prisma, perché il controllo fine su `SELECT … FOR UPDATE` e sulle transazioni è scomodo. TypeORM, perché è fragile e ha tipi poco affidabili. SQL grezzo, perché perde la sicurezza dei tipi.  
> Conseguenze: vedi l'SQL che esegui e i tipi sono generati dallo schema. Le relazioni vanno scritte a mano.

> **ADR-003: Capienza garantita dal database, in transazione**  
> Stato: proposta  
> Contesto: picco del lunedì alle 7:00 (bootstrap › Vincoli). Se il controllo "c'è posto?" e l'inserimento avvengono separati, si crea overbooking.  
> Decisione: ogni prenotazione è una transazione con la sequenza lock della riga del corso (`FOR UPDATE`), conteggio dei confermati, inserimento come `confermata` oppure `in_attesa`. Anche la cancellazione promuove il primo in attesa dentro la stessa transazione. Un vincolo `UNIQUE (corso_id, iscritto_id)` impedisce le prenotazioni doppie.  
> Alternative scartate: contatore in Redis, perché è un'infrastruttura in più e dà due fonti di verità. Lock ottimistico con retry, perché sotto picco genera molti conflitti sullo stesso corso.  
> Conseguenze: la correttezza è garantita anche con più istanze. Le richieste sullo stesso corso vengono serializzate, il che è accettabile perché la transazione è breve.

> **ADR-004: Regole di dominio pure, orologio iniettato**  
> Stato: proposta  
> Contesto: la regola delle 12 ore e la logica della lista d'attesa vanno testate senza DB e senza dipendere dall'ora reale.  
> Decisione: il dominio contiene solo funzioni pure. L'ora corrente arriva come parametro. Tutte le date sono `timestamptz` salvate in UTC.  
> Alternative scartate: logica nelle route o nelle query, perché diventa intestabile. `Date.now()` sparso nel codice, perché rende i test non deterministici.  
> Conseguenze: i test unitari sono istantanei. Serve disciplina nel non importare l'infrastruttura dal dominio.

> **ADR-005: Vitest + Testcontainers per i test**  
> Stato: proposta  
> Contesto: le regole pure richiedono test unitari, mentre la concorrenza dell'ADR-003 si verifica solo su un Postgres vero.  
> Decisione: Vitest per tutti i test. Per l'integrazione, Testcontainers avvia un Postgres reale. Un test lancia N prenotazioni parallele sull'ultimo posto e verifica che ne passi una sola.  
> Alternative scartate: Jest, perché è più lento con TypeScript ESM. Un DB mockato, perché non prova i lock.  
> Conseguenze: l'overbooking è coperto da un test. Serve Docker in locale e in CI.

## Architettura

Ci sono tre strati e le dipendenze vanno solo verso l'interno: **http → applicazione → dominio**. L'infrastruttura implementa le interfacce (porte) definite dall'applicazione.

- **dominio**: tipi e regole pure (cancellabilità, esito di una prenotazione, promozione dalla lista).
- **applicazione**: casi d'uso (`prenota`, `cancella`, `creaCorso`). Orchestrano la transazione tramite le porte.
- **infrastruttura**: Kysely, repository, migrazioni.
- **http**: route Fastify, schemi di validazione, mappatura degli errori in codici HTTP.

```
src/
  dominio/          tipi e regole pure, nessun import esterno
  applicazione/     casi d'uso e interfacce dei repository
  infrastruttura/
    db/             connessione Kysely, tipi dello schema
    migrazioni/     migrazioni SQL versionate
    repository/     implementazioni Postgres delle porte
  http/
    route/          endpoint per iscritti e staff
    schemi/         validazione input/output
  config/           lettura e validazione delle variabili d'ambiente
  server.ts         avvio dell'app
test/
  unit/             test del dominio
  integrazione/     test con Postgres reale
```

## Roadmap

1. **Setup**: TypeScript, Vitest, ESLint e un primo test verde su una funzione pura. Si verifica con `npm test` verde.
2. **Regola delle 12 ore**: funzione di dominio con test sui casi limite (11h59, 12h00, 12h01). Si verifica con i test verdi.
3. **Schema DB**: Postgres in Docker Compose e migrazioni per `corsi`, `iscritti` e `prenotazioni`, con il vincolo unico. Si verifica che la migrazione salga e scenda pulita.
4. **Prenotazione transazionale**: caso d'uso con lock, più il test di concorrenza (ADR-003). Si verifica che 20 richieste parallele sull'ultimo posto diano 1 confermata e 19 in attesa.
5. **Cancellazione con promozione**: il primo in attesa diventa confermato. Si verifica con un test d'integrazione.
6. **API HTTP**: route Fastify con validazione ed errori coerenti. Si verifica con test via `fastify.inject`.
7. **Ruoli iscritto/staff**: autenticazione e autorizzazione sulle route dello staff. Si verifica che un iscritto riceva 403 sulle route staff.
8. **Prova di carico del lunedì**: script con autocannon sull'apertura dei corsi. Si verifica che non ci sia overbooking e che la latenza resti accettabile.

## Da dove cominciare

Comincia dallo **step 1, chiudendolo con la funzione della regola delle 12 ore** (`src/dominio/cancellazione.ts` più il suo test). È piccola e non richiede database. Ti dà subito un progetto che compila, un test verde e la prima regola vera del dominio, testata ai bordi.

Se approvi le decisioni, ti preparo i comandi e i file di configurazione (`package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`).
