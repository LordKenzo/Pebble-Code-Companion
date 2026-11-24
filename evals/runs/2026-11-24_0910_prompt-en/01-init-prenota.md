# Prenota: proposta iniziale

## 1. Cosa ho capito

Un'API REST in Node + TypeScript su Postgres. Gli iscritti prenotano e cancellano i corsi. Lo staff gestisce corsi e capienza. Ci sono due regole di dominio: la cancellazione è gratuita fino a 12 ore prima e, a corso pieno, si entra in lista d'attesa. Il rischio tecnico vero è il picco del lunedì alle 7:00: tante richieste sullo stesso posto nello stesso istante (bootstrap › Vincoli).

## 2. Decisioni proposte

> **ADR-001: Fastify come framework HTTP**  
> Status: proposed  
> Context: serve un server HTTP che regga il picco del lunedì e validi gli input.  
> Decision: Fastify, con validazione degli input tramite JSON Schema.  
> Alternatives ruled out: Express, più lento e senza validazione nativa. NestJS, troppa struttura per un'API di questa taglia.  
> Consequences: ottime prestazioni e validazione dichiarativa. In cambio c'è un ecosistema di plugin da imparare.

> **ADR-002: Kysely (query builder tipizzato) invece di un ORM**  
> Status: proposed  
> Context: "Se usare un ORM" (bootstrap › Non so ancora). La prenotazione richiede transazioni e lock espliciti (ADR-003).  
> Decision: Kysely per le query e le migrazioni, con tipi TypeScript per le tabelle.  
> Alternatives ruled out: Prisma, che per `SELECT … FOR UPDATE` costringe a scrivere SQL grezzo e nasconde la transazione. TypeORM, con tipi deboli e troppa "magia".  
> Consequences: vedi l'SQL che esegui e i lock sono naturali da scrivere. In cambio scrivi un po' più di codice di mappatura.

> **ADR-003: Capienza protetta da transazione con lock sul corso**  
> Status: proposed  
> Context: al picco del lunedì due iscritti possono prendere l'ultimo posto nello stesso millisecondo.  
> Decision: ogni prenotazione o cancellazione avviene in una transazione che blocca la riga del corso (`SELECT … FOR UPDATE`), conta i posti e inserisce lo stato `confermata` oppure `in_attesa`. Un vincolo `UNIQUE(corso_id, iscritto_id)` impedisce i doppioni.  
> Alternatives ruled out: un contatore in memoria, che si perde con più istanze. Una coda Redis, prematura finché non misuriamo un problema.  
> Consequences: niente overbooking, garantito dal DB. Le richieste sullo stesso corso si serializzano, il che va verificato con un test di carico.

> **ADR-004: Moduli per funzionalità, dominio puro**  
> Status: proposed  
> Context: "Come strutturare le cartelle" (bootstrap › Non so ancora).  
> Decision: una cartella per funzionalità (`bookings`, `courses`). In ognuna, `domain/` contiene funzioni pure senza DB né orologio: l'ora attuale arriva come parametro. Le date si salvano come `timestamptz`.  
> Alternatives ruled out: cartelle per tipo tecnico (`controllers/`, `models/`), che sparpagliano una funzionalità in cinque posti.  
> Consequences: le regole delle 12 ore e della lista d'attesa si testano senza database. In cambio va rispettata la direzione delle dipendenze.

> **ADR-005: Vitest, con test di integrazione su Postgres reale**  
> Status: proposed  
> Context: le regole di dominio e la concorrenza vanno verificate in modi diversi.  
> Decision: Vitest per tutto. Il dominio si testa con test unitari. I repository e la concorrenza si testano su un Postgres avviato con `docker compose`.  
> Alternatives ruled out: Jest, più lento con TypeScript. Un DB in memoria o mock, che non riproducono i lock.  
> Consequences: test veloci sul dominio e affidabili sulla concorrenza. In cambio serve Docker in locale e in CI.

## 3. Architettura

Gli strati sono quattro: **http** (route Fastify) → **application** (casi d'uso) → **domain** (regole pure). Accanto c'è **repository** (Kysely), chiamato dall'application. Il dominio non dipende da nulla (ADR-004).

```
src/
  modules/
    bookings/
      domain/        regole pure: cancellazione 12h, lista d'attesa
      application/   casi d'uso: prenota, cancella (aprono la transazione)
      repository/    query Kysely su prenotazioni
      http/          route e schemi di validazione
    courses/
      domain/  application/  repository/  http/
  db/
    migrations/      migrazioni Kysely
    schema.ts        tipi delle tabelle
  app.ts             costruzione dell'istanza Fastify
  server.ts          avvio
test/
  integration/       test su Postgres reale
docker-compose.yml   Postgres locale e per i test
```

## 4. Roadmap

1. **Setup**: `package.json`, TypeScript, Vitest e un primo test verde su una funzione di dominio vuota. Si fa in una sessione.
2. **Regola di cancellazione**: una funzione pura che, dati l'inizio del corso e l'ora attuale, dice se la cancellazione è gratuita. Test sui bordi: 12h esatte, 11h59.
3. **Capienza e lista d'attesa**: funzioni pure che decidono `confermata` o `in_attesa` e chi viene promosso dopo una cancellazione.
4. **Database**: `docker compose` con Postgres, migrazioni per le tabelle `corsi` e `prenotazioni` e i vincoli dell'ADR-003.
5. **Caso d'uso "prenota"**: transazione con lock. Un test di integrazione con 20 prenotazioni parallele su un corso da 10 posti deve dare 10 confermate e 10 in attesa.
6. **API iscritti**: prenota, cancella, le mie prenotazioni.
7. **API staff**: creazione dei corsi e modifica della capienza, con controllo del ruolo.
8. **Prova del picco**: test di carico (autocannon) che simula il lunedì alle 7:00 e verifica l'assenza di overbooking.

## 5. Da dove cominciare

Comincia da `src/modules/bookings/domain/cancellation.ts` e dal suo test. È la regola più chiara del bootstrap, non richiede database né server e ti dà subito un test verde che conferma il setup (passo 1 e 2 della roadmap).

Quando c'è un posto libero, la prima persona in lista d'attesa va confermata automaticamente, oppure riceve un'offerta con una scadenza per accettarla?
