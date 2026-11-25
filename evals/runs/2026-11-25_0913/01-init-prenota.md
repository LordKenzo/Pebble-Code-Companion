# Prenota · avvio progetto

## 1. Lettura del bootstrap

Un'API REST in Node + TypeScript su Postgres. Gli iscritti prenotano e cancellano i corsi; lo staff gestisce corsi e capienza. Ci sono due regole di dominio: la cancellazione è gratuita fino a 12 ore prima, e oltre la capienza si va in lista d'attesa. Il rischio tecnico principale è il picco del lunedì alle 7:00: molte prenotazioni concorrenti sullo stesso corso non devono mai superare la capienza.

## 2. Decisioni proposte

> **ADR-001: struttura a strati, cartelle per strato**  
> Status: proposed  
> Context: il bootstrap chiede come strutturare le cartelle. Le regole (12 ore, lista d'attesa) devono essere testabili senza database.  
> Decision: tre strati in `src/`: `dominio` (regole pure, nessuna dipendenza), `applicazione` (casi d'uso: prenota, cancella, gestisci corso) e `infrastruttura` (Postgres, HTTP). Le dipendenze puntano solo verso il dominio.  
> Alternatives ruled out: cartelle per feature fin da subito, perché con 2 aree (iscritti, staff) aggiungono struttura senza beneficio. Codice nei controller, perché le regole diventano testabili solo via HTTP.  
> Consequences: i test di dominio sono veloci e senza setup. Qualche interfaccia in più tra applicazione e infrastruttura.

> **ADR-002: niente ORM, query builder Kysely con migrazioni**  
> Status: proposed  
> Context: il bootstrap chiede se usare un ORM. Il picco del lunedì richiede transazioni esplicite e lock di riga (`SELECT … FOR UPDATE`).  
> Decision: Kysely per query tipizzate e transazioni, con le sue migrazioni versionate in `migrazioni/`. Driver `pg`.  
> Alternatives ruled out: Prisma, perché il lock di riga richiede SQL grezzo e le transazioni interattive sono meno dirette. TypeORM, per la magia dei decorator e i tipi deboli. `pg` puro, perché perde la tipizzazione delle query.  
> Consequences: il SQL resta visibile e controllabile. Lo schema dei tipi del DB va mantenuto a mano o generato (`kysely-codegen`).

> **ADR-003: concorrenza con transazione e lock sulla riga del corso**  
> Status: proposed  
> Context: il picco del lunedì alle 7:00 porta prenotazioni simultanee e il rischio di overbooking.  
> Decision: ogni prenotazione o cancellazione avviene in una transazione che blocca la riga del corso (`FOR UPDATE`), conta i posti confermati e decide "confermata" o "in attesa". La promozione dalla lista d'attesa avviene nella stessa transazione della cancellazione. Un vincolo `UNIQUE (corso_id, iscritto_id)` impedisce i doppioni.  
> Alternatives ruled out: un contatore in memoria o Redis, perché richiede una seconda fonte di verità e non serve a questi volumi. Isolamento `SERIALIZABLE`, perché obbliga a gestire i retry ovunque.  
> Consequences: la correttezza è garantita dal DB. Le prenotazioni sullo stesso corso vengono serializzate, il che è accettabile perché sono brevi.

> **ADR-004: Fastify per l'HTTP, validazione con schemi**  
> Status: proposed  
> Context: serve un server HTTP leggero e performante sotto picco.  
> Decision: Fastify con validazione degli input tramite JSON Schema (TypeBox per i tipi).  
> Alternatives ruled out: Express, più lento e senza validazione integrata. NestJS, troppo framework per questo perimetro.  
> Consequences: le route sono sottili e chiamano i casi d'uso. Bisogna imparare il sistema di plugin di Fastify.

> **ADR-005: Vitest, con Postgres reale per i test d'integrazione e orologio iniettato**  
> Status: proposed  
> Context: la regola delle 12 ore dipende dall'ora corrente, e la concorrenza si verifica solo su un Postgres vero.  
> Decision: Vitest per tutti i test. I test di dominio sono puri e ricevono `adesso` come parametro (mai `new Date()` nel dominio). I test d'integrazione usano Postgres in Docker (`docker compose`). Tutte le date sono `timestamptz` in UTC.  
> Alternatives ruled out: Jest, più lento con TypeScript. Mock del DB, perché non prova i lock.  
> Consequences: i test sul confine delle 12 ore sono deterministici. Serve Docker in locale e in CI.

## 3. Architettura

`infrastruttura/http` chiama `applicazione`, che usa `dominio` e le interfacce dei repository. `infrastruttura/db` implementa quelle interfacce. Il dominio non importa nulla.

```
src/
  dominio/          regole pure: capienza, lista d'attesa, finestra di cancellazione
  applicazione/     casi d'uso e interfacce dei repository
  infrastruttura/
    db/             connessione Kysely, implementazioni dei repository
    http/           server Fastify, route iscritti e staff, schemi
  main.ts           avvio: compone db, casi d'uso, server
migrazioni/         migrazioni Kysely versionate
test/
  integrazione/     test contro Postgres in Docker
docker-compose.yml  Postgres locale
```

## 4. Roadmap

1. **Setup**: `package.json`, `tsconfig`, Vitest e un test che passa. Fatto quando `npm test` è verde.
2. **Regole di dominio**: finestra di cancellazione di 12 ore e decisione confermata/in attesa, guidate dai test. Fatto quando i casi limite (12h esatte, corso pieno) sono verdi.
3. **Database**: Postgres in Docker e migrazioni per `corsi` e `prenotazioni` (stato, posizione in lista). Fatto quando le migrazioni girano da zero.
4. **Casi d'uso prenota/cancella** con transazione e lock (ADR-003), inclusa la promozione dalla lista. Fatto quando passano i test d'integrazione.
5. **Test di concorrenza**: 50 prenotazioni simultanee su un corso da 20 producono esattamente 20 confermate e 30 in attesa.
6. **API iscritti** con Fastify: prenota, cancella, le mie prenotazioni. Fatto quando passano i test HTTP con `inject`.
7. **API staff**: crea corso, modifica capienza (aumentarla promuove dalla lista). Fatto quando passano i test.
8. **Autenticazione e ruoli** iscritto/staff. Fatto quando le route staff rifiutano gli iscritti.

## 5. Da dove cominciare

Dal passo 1, poi subito il file `src/dominio/cancellazione.ts` con i suoi test. È la regola più piccola e più chiara del bootstrap, non richiede database, e ti costringe fin dall'inizio a passare `adesso` come parametro (ADR-005), una scelta difficile da recuperare dopo.
