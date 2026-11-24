## 1. Lettura del bootstrap

Prenota è un'API in Node + TypeScript su Postgres per prenotare corsi fitness. Ha due ruoli: iscritti e staff. Le regole di dominio sono la cancellazione gratuita entro 12 ore e la lista d'attesa. Il punto critico tecnico è il picco del lunedì alle 7:00: molte richieste simultanee sugli stessi posti, quindi non si deve mai superare la capienza.

## 2. Decisioni proposte

> **ADR-001: Fastify come framework HTTP**  
> Status: proposed  
> Context: serve un server HTTP tipizzato che regga i picchi del lunedì.  
> Decision: Fastify, con validazione degli input tramite JSON Schema/TypeBox sulle rotte.  
> Alternatives ruled out: Express, perché è più lento, non valida nativamente e ha tipi meno curati. NestJS, perché porta troppa struttura per un'API di queste dimensioni.  
> Consequences: validazione e serializzazione veloci incluse. Bisogna imparare il sistema di plugin di Fastify.

> **ADR-002: Kysely come query builder, niente ORM**  
> Status: proposed  
> Context: "Se usare un ORM". La prenotazione richiede controllo preciso su transazioni e lock.  
> Decision: Kysely (SQL tipizzato) con il driver `pg`. Le migrazioni si fanno con il migrator di Kysely.  
> Alternatives ruled out: Prisma, che nasconde il SQL e rende scomodo il `SELECT … FOR UPDATE`. TypeORM, che è fragile e porta troppa "magia". SQL grezzo, che non dà tipi.  
> Consequences: il SQL resta visibile e i tipi controllano le query. Le relazioni e le migrazioni vanno scritte a mano.

> **ADR-003: Architettura a tre strati con dominio puro**  
> Status: proposed  
> Context: "Come strutturare le cartelle". Le regole (12 ore, capienza, lista d'attesa) vanno testate senza database.  
> Decision: tre strati.  
> - `dominio`: funzioni pure, senza I/O.  
> - `applicazione`: casi d'uso che orchestrano dominio e repository.  
> - `infrastruttura`: HTTP, Kysely, configurazione.  
>
> I casi d'uso dipendono da interfacce di repository, non da Kysely.  
> Alternatives ruled out: cartelle per tipo tecnico (`controllers/`, `models/`), che spargono la logica. Una architettura esagonale completa, eccessiva a questa scala.  
> Consequences: test del dominio istantanei. In cambio c'è qualche interfaccia in più da mantenere.

> **ADR-004: Concorrenza con transazione e lock sulla riga del corso**  
> Status: proposed  
> Context: il picco del lunedì alle 7:00 porta richieste concorrenti sullo stesso posto.  
> Decision: ogni prenotazione o cancellazione gira in una transazione che fa `SELECT … FOR UPDATE` sulla riga del corso. Poi conta i posti e inserisce come confermata o in attesa. La cancellazione promuove il primo in lista nella stessa transazione. Un vincolo `UNIQUE (corso_id, iscritto_id)` blocca le doppie prenotazioni. Gli orari si salvano come `timestamptz`.  
> Alternatives ruled out: un contatore in Redis, che è un'infrastruttura in più e crea due fonti di verità. Il lock ottimistico con retry, che sotto picco genera molti conflitti.  
> Consequences: la capienza è garantita dal database. Le richieste sullo stesso corso vengono serializzate, accettabile perché un corso ha decine di posti, non migliaia.

> **ADR-005: Vitest, con test di integrazione su Postgres reale**  
> Status: proposed  
> Context: il dominio va testato da subito, la concorrenza solo su un database vero.  
> Decision: Vitest per tutto. I test del dominio sono unitari. I test dei repository e della concorrenza girano su Postgres in Docker (`docker compose`).  
> Alternatives ruled out: Jest, che richiede più configurazione con TypeScript ed ESM. Un database in memoria (pg-mem), che non riproduce i lock.  
> Consequences: i test sono affidabili sulla capienza. In cambio serve Docker in locale e in CI.

## 3. Architettura

Le dipendenze vanno in un solo verso: infrastruttura → applicazione → dominio. Il dominio non importa nulla dagli altri strati.

```
prenota/
├── src/
│   ├── dominio/          regole pure: cancellazione, capienza, lista d'attesa
│   ├── applicazione/     casi d'uso (prenota, cancella, gestisci corso) e interfacce repository
│   ├── infrastruttura/
│   │   ├── db/           connessione Kysely, repository, migrazioni
│   │   └── http/         server Fastify, rotte, schemi di validazione
│   └── config/           lettura e validazione delle variabili d'ambiente
├── test/
│   └── integrazione/     test su Postgres reale, inclusa la concorrenza
├── docker-compose.yml    Postgres per sviluppo e test
└── .pebble/              decisioni e roadmap
```

I test unitari stanno accanto ai file (`*.test.ts`), quelli di integrazione in `test/`.

## 4. Roadmap

1. **Setup**: `package.json`, `tsconfig`, Vitest e un primo test verde sulla regola delle 12 ore.
2. **Dominio**: capienza e lista d'attesa (decidere se posto confermato o in attesa, chi promuovere), con tutti i casi limite testati.
3. **Database**: `docker-compose`, Kysely e le migrazioni per corsi, iscritti e prenotazioni, con il vincolo `UNIQUE`.
4. **Casi d'uso**: prenota e cancella in transazione con `FOR UPDATE`. Pronto quando un test di integrazione verifica la promozione dalla lista.
5. **Test di concorrenza**: 50 prenotazioni simultanee su un corso da 20 producono 20 confermate e 30 in attesa.
6. **HTTP**: rotte Fastify per iscritti e staff, con validazione degli input.
7. **Ruoli e autenticazione**: distinguere iscritto e staff sulle rotte.
8. **CI**: pipeline con test unitari e di integrazione.

## 5. Da dove cominciare

Comincia da `src/dominio/cancellazione.ts` e dal suo test. È una regola pura del bootstrap ("gratuita fino a 12 ore prima"), quindi non serve né database né server. In una sessione hai un progetto che compila e un test verde. Ti costringe anche a decidere subito come rappresentare il tempo (ADR-004), per esempio cosa succede esattamente a 12 ore.

Una domanda prima di partire: cancellare dopo le 12 ore è vietato, oppure è permesso con una penale (per esempio un ingresso scalato)? Cambia cosa restituisce la funzione.
