## 1. Lettura del bootstrap

Un'API REST in Node + TypeScript su Postgres, con due ruoli: iscritti (prenotano, cancellano) e staff (corsi, capienza). Le regole di dominio sono tre: cancellazione gratuita fino a 12 ore prima, lista d'attesa a corso pieno e il picco del lunedì alle 7:00. Il picco è il punto critico: molte richieste contemporanee sullo stesso corso non devono mai superare la capienza.

## 2. Decisioni proposte

> **ADR-001: Capienza garantita da transazione con lock sul corso**  
> Stato: proposto  
> Contesto: lunedì alle 7:00 decine di richieste arrivano insieme sullo stesso corso. Con un semplice "conta e inserisci" due richieste leggono "1 posto libero" ed entrano entrambe.  
> Decisione: ogni prenotazione e ogni cancellazione è una transazione Postgres che blocca la riga del corso con `SELECT … FOR UPDATE`, conta i posti e decide tra "confermata" e "in attesa". C'è anche un vincolo `UNIQUE (corso_id, iscritto_id)` contro i doppi clic.  
> Alternative scartate: contatore in Redis (infrastruttura in più per un volume che Postgres regge); lock ottimistico con retry (al picco i conflitti sono la norma e i retry si moltiplicano).  
> Conseguenze: la correttezza è garantita dal database ed è testabile con richieste parallele. Le richieste sullo stesso corso vengono servite in fila, accettabile per la capienza di una sala.

> **ADR-002: Kysely come query builder, niente ORM completo**  
> Stato: proposto  
> Contesto: hai chiesto se usare un ORM. ADR-001 richiede controllo preciso su transazioni e lock.  
> Decisione: Kysely per le query tipizzate e il suo migrator per lo schema, con il driver `pg`.  
> Alternative scartate: Prisma (gestisce `FOR UPDATE` e le transazioni interattive in modo scomodo, spesso serve SQL grezzo); TypeORM (nasconde l'SQL proprio dove ti serve vederlo); `pg` puro (nessun tipo sulle righe).  
> Conseguenze: scrivi SQL quasi in chiaro e i tipi sono controllati. Devi tenere a mano i tipi delle tabelle, oppure generarli con `kysely-codegen`.

> **ADR-003: Dominio puro separato da HTTP e database**  
> Stato: proposto  
> Contesto: le regole delle 12 ore e della lista d'attesa sono il cuore del progetto e devono essere testabili senza database.  
> Decisione: architettura a livelli. `domain` contiene funzioni pure, che ricevono anche l'ora attuale come parametro. `services` orchestra transazioni e repository. `db` e `http` sono adattatori.  
> Alternative scartate: logica nei controller (non testabile senza HTTP e DB); architettura esagonale completa con porte per tutto (troppa cerimonia per questa dimensione).  
> Conseguenze: i test del dominio sono rapidi e deterministici. Serve disciplina: `domain` non importa mai da `db` o `http`.

> **ADR-004: Fastify per l'HTTP**  
> Stato: proposto  
> Contesto: serve un framework con validazione degli input e buone prestazioni al picco.  
> Decisione: Fastify, con validazione degli input tramite schema JSON tipizzato (TypeBox).  
> Alternative scartate: Express (validazione e tipi da aggiungere a mano, più lento); NestJS (struttura pesante che si sovrappone ad ADR-003).  
> Conseguenze: input validati prima di raggiungere i servizi e `app.inject()` per i test delle rotte senza aprire porte.

> **ADR-005: Vitest, con test d'integrazione su Postgres reale**  
> Stato: proposto  
> Contesto: la correttezza di ADR-001 si verifica solo su un database vero.  
> Decisione: Vitest per tutto. Unit test sul `domain`, test d'integrazione su un Postgres avviato con Docker Compose, con un database di test separato.  
> Alternative scartate: Jest (configurazione TypeScript/ESM più faticosa); database in memoria o mock (non riproducono lock e transazioni).  
> Conseguenze: i test d'integrazione sono affidabili, al costo di avere Docker attivo durante lo sviluppo.

## 3. Architettura

Le dipendenze vanno in una sola direzione: `http → services → domain` e `services → db`. `domain` non dipende da nulla.

```
prenota/
├── src/
│   ├── domain/        regole pure: cancellazione, esito prenotazione, lista d'attesa
│   ├── services/      casi d'uso: prenota, cancella, gestisci corso (transazioni)
│   ├── db/            connessione Kysely, tipi delle tabelle, repository
│   │   └── migrations/  schema versionato
│   ├── http/          server Fastify, rotte, schemi di validazione
│   └── config/        lettura e validazione delle variabili d'ambiente
├── test/
│   └── integration/   test su Postgres reale (servizi e rotte)
├── docker-compose.yml Postgres per sviluppo e test
└── .pebble/           bootstrap, architettura, ADR, percorso
```

Gli unit test del dominio stanno accanto al file (`*.test.ts`), quelli d'integrazione in `test/integration` (`buona pratica`).

## 4. Roadmap

1. **Setup**: TypeScript, Vitest e un test banale che passa con `npm test`.
2. **Regola delle 12 ore** in `domain`: una funzione pura che riceve l'ora del corso e l'ora attuale. Verificabile con i test sui casi a 12h esatte, 11h59 e 12h01.
3. **Esito della prenotazione e promozione dalla lista d'attesa** in `domain`: confermata, in attesa o già prenotato, e chi sale quando un posto si libera. Verificabile con test puri.
4. **Postgres e schema**: Docker Compose, migrazioni per corsi, iscritti e prenotazioni, con il vincolo UNIQUE. Verificabile con le migrazioni applicate su un database pulito.
5. **Servizio di prenotazione transazionale** (ADR-001). Verificabile con un test d'integrazione: 30 prenotazioni parallele su un corso da 20 producono 20 confermate e 10 in attesa.
6. **Cancellazione con promozione** dalla lista d'attesa, nella stessa transazione. Verificabile con un test d'integrazione.
7. **API HTTP per iscritti e staff**, con il controllo del ruolo. Verificabile con test su `app.inject()`.
8. **Prova di carico del lunedì** con autocannon. Verificabile con zero overbooking e i tempi di risposta misurati.

## 5. Da dove partire

Dal **passo 1**, e subito dopo da `src/domain/cancellazione.ts`. È la regola più piccola e chiara del bootstrap: non richiede né database né HTTP. In una sessione hai un progetto che compila e il primo test di dominio verde. Scegli anche presto la convenzione sui fusi orari: salva tutto come `timestamptz`, in UTC (`buona pratica`). Le 12 ore non devono saltare al cambio dell'ora legale.
