## 1. Lettura del bootstrap

Un'API REST in Node + TypeScript su Postgres. Ha due ruoli: gli iscritti prenotano e cancellano, lo staff gestisce corsi e capienza. Il punto critico è la concorrenza. Il lunedì alle 7:00 molti iscritti si contendono gli stessi posti, e la capienza non deve mai essere superata. Le altre due regole di dominio sono la cancellazione gratuita entro 12 ore e la lista d'attesa.

## 2. Decisioni proposte

> **ADR-001: Struttura a moduli per funzionalità, con dominio puro**  
> Status: proposed  
> Context: non sai ancora come strutturare le cartelle, e le regole (12 ore, capienza, lista d'attesa) vanno testate senza database.  
> Decision: un modulo per area (`corsi`, `prenotazioni`). Ogni modulo ha `dominio/` (funzioni pure, nessun import di DB o HTTP), `applicazione/` (casi d'uso) e `infrastruttura/` (DB, HTTP). Le dipendenze puntano verso il dominio.  
> Alternatives ruled out: cartelle per tipo tecnico (`controllers/`, `models/`), perché una funzionalità finisce sparsa in 4 cartelle; esagonale completa, troppo cerimoniale per due moduli.  
> Consequences: il dominio si testa in millisecondi. Costa qualche file in più e un po' di disciplina sugli import.

> **ADR-002: Kysely come query builder, niente ORM completo**  
> Status: proposed  
> Context: chiedevi se usare un ORM. Il picco del lunedì richiede controllo fine su transazioni e lock.  
> Decision: Kysely, un query builder tipizzato che genera SQL leggibile, con migrazioni Kysely versionate nel repository.  
> Alternatives ruled out: Prisma, perché il lock di riga (`FOR UPDATE`) e le transazioni interattive sono scomodi; TypeORM, perché ha tipi deboli e troppa "magia"; `pg` puro, perché è verboso e non tipizzato.  
> Consequences: SQL esplicito e prevedibile sotto carico. Le query si scrivono a mano, senza relazioni automatiche.

> **ADR-003: Capienza garantita da lock pessimistico in transazione**  
> Status: proposed  
> Context: senza protezione, alle 7:00 due richieste vedono entrambe "1 posto libero" e prenotano entrambe.  
> Decision: ogni prenotazione o cancellazione apre una transazione e blocca la riga del corso con `SELECT … FOR UPDATE`. Dentro la stessa transazione decide se dare il posto o la lista d'attesa. Un vincolo `UNIQUE (corso_id, iscritto_id)` impedisce i doppi click.  
> Alternatives ruled out: il lock ottimistico con retry, perché con alta contesa sullo stesso corso i retry esplodono; una coda o Redis, perché sono infrastruttura in più che oggi non serve.  
> Consequences: correttezza semplice da ragionare. Le richieste sullo stesso corso vengono servite una alla volta, ma per uno studio fitness è accettabile. Il carico lo verifichiamo al passo 7.

> **ADR-004: Vitest e orologio iniettato per le regole temporali**  
> Status: proposed  
> Context: la regola delle 12 ore dipende dall'ora attuale, e un test che usa l'ora reale è fragile.  
> Decision: test con Vitest. Le funzioni di dominio ricevono `adesso` come parametro, non chiamano `new Date()`. Gli orari sono salvati come `timestamptz` in UTC.  
> Alternatives ruled out: Jest, perché la configurazione TS ed ESM richiede più attrito; i timer finti globali, meno espliciti di un parametro.  
> Consequences: i casi limite (11h59, 12h00 esatte) si testano in modo deterministico.

> **ADR-005: Fastify per lo strato HTTP**  
> Status: proposed  
> Context: serve un server HTTP con validazione degli input.  
> Decision: Fastify, con schemi JSON per validare body e parametri.  
> Alternatives ruled out: Express, perché non ha validazione nativa ed è più lento; NestJS, troppo pesante per questa dimensione.  
> Consequences: buone prestazioni nel picco. Bisogna imparare il sistema di plugin.

## 3. Architettura

Gli strati e le dipendenze vanno in quest'ordine: `http` → `applicazione` → `dominio`. Lo strato `infrastruttura/db` implementa le interfacce richieste da `applicazione`. Il dominio non importa nulla da nessun altro strato.

```
src/
  modules/
    corsi/
      dominio/          regole su corso e capienza
      applicazione/     casi d'uso staff (crea corso, cambia capienza)
      infrastruttura/   repository Kysely, rotte Fastify
    prenotazioni/
      dominio/          regole 12 ore, lista d'attesa, promozione
      applicazione/     prenota, cancella (transazione + lock)
      infrastruttura/   repository Kysely, rotte Fastify
  db/
    migrations/         migrazioni versionate
    client.ts           connessione condivisa
  http/
    server.ts           avvio Fastify, registrazione moduli
test/
  integrazione/         test con Postgres reale
```

## 4. Roadmap

1. **Setup e prima regola.** Progetto TS + Vitest configurati, funzione di dominio per la cancellazione gratuita con test verdi (12h01, 12h00, 11h59).
2. **Dominio prenotazioni.** Funzioni pure che decidono "posto o lista d'attesa" e chi promuovere quando si libera un posto, tutte testate.
3. **Database.** Postgres in Docker Compose, migrazioni Kysely per `corsi`, `iscritti` e `prenotazioni`, con vincolo unico. Fatto quando `migrate` gira senza errori.
4. **Casi d'uso transazionali.** Prenota e cancella con `FOR UPDATE`. È fatto quando un test di integrazione con 50 prenotazioni parallele su 10 posti produce esattamente 10 confermate e 40 in attesa.
5. **API iscritti.** Rotte Fastify per prenotare, cancellare e vedere le proprie prenotazioni, con validazione.
6. **API staff e ruoli.** CRUD corsi e capienza, accesso distinto staff/iscritto.
7. **Prova del lunedì.** Test di carico (k6) che simula l'apertura delle 7:00, con tempi di risposta misurati e nessuna capienza superata.

## 5. Da dove cominciare

Dal file `src/modules/prenotazioni/dominio/cancellazione.ts` e dal suo test. È la regola più piccola e isolata del bootstrap: nessun database, nessun HTTP. In una sessione hai il progetto che compila, Vitest configurato e il primo test verde, con il caso limite delle 12 ore esatte già deciso.

**Domanda:** quando un posto si libera, il primo in lista d'attesa viene prenotato automaticamente, o riceve un'offerta da confermare entro un certo tempo?
