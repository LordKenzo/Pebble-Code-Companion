## Lettura del bootstrap

Un'API REST per uno studio fitness. Gli iscritti prenotano e cancellano, lo staff gestisce corsi e capienza. Il punto critico è il lunedì alle 7:00: molte richieste sullo stesso corso nello stesso istante. Senza una strategia, la capienza viene superata. Le regole di dominio sono la cancellazione gratuita fino a 12h prima e la lista d'attesa.

## Decisioni proposte

> **ADR-001: architettura a strati con dominio puro**  
> Stato: proposto  
> Contesto: `bootstrap › Non so ancora` chiede come strutturare le cartelle. Le regole (12h, lista d'attesa) devono essere testabili senza database.  
> Decisione: quattro strati, cioè `dominio` (regole pure), `applicazione` (casi d'uso), `infrastruttura` (Postgres) e `http` (rotte). Le dipendenze puntano solo verso il dominio.  
> Alternative scartate: cartelle per tipo tecnico (`controllers/`, `models/`), perché mescolano regole e SQL e rendono i test lenti. Esagonale completa con porte per ogni cosa: troppa cerimonia per questo progetto.  
> Conseguenze: il dominio si testa in millisecondi. Serve un po' di disciplina sugli import.

> **ADR-002: Kysely come query builder, niente ORM**  
> Stato: proposto  
> Contesto: `bootstrap › Non so ancora`, cioè se usare un ORM. Il picco del lunedì richiede transazioni e lock espliciti (vedi ADR-003).  
> Decisione: Kysely, un query builder tipizzato: scrivi SQL con i tipi di TypeScript. Le migrazioni usano il migrator di Kysely e il driver è `pg`.  
> Alternative scartate: Prisma, perché `SELECT … FOR UPDATE` richiede SQL grezzo e nasconde le transazioni. TypeORM, perché basato su decorator e con comportamenti impliciti. SQL a mano senza tipi, perché fragile ai cambi di schema.  
> Conseguenze: controllo totale su lock e query. Niente relazioni automatiche: i join li scrivi tu.

> **ADR-003: concorrenza con lock pessimistico sulla riga del corso**  
> Stato: proposto  
> Contesto: `bootstrap › Vincoli`, cioè i picchi del lunedì alle 7:00. Due prenotazioni simultanee per l'ultimo posto non devono riuscire entrambe.  
> Decisione: ogni prenotazione o cancellazione gira in una transazione che blocca la riga del corso (`FOR UPDATE`), conta i posti e inserisce. Aggiungiamo un vincolo `UNIQUE (iscritto, corso)` contro i doppi click.  
> Alternative scartate: lock ottimistico con retry, perché al picco i conflitti sono la norma e i retry si moltiplicano. Coda Redis, perché è un'infrastruttura in più per un volume che Postgres regge.  
> Conseguenze: la correttezza è garantita dal database. Le richieste sullo stesso corso vengono serializzate, quindi la latenza al picco va misurata.

> **ADR-004: regole temporali con orologio iniettato e orari in UTC**  
> Stato: proposto  
> Contesto: `bootstrap › Vincoli`, cioè la cancellazione gratuita fino a 12h prima. Le regole sul tempo sono le più difficili da testare.  
> Decisione: le funzioni di dominio ricevono `adesso` come parametro, non chiamano mai `new Date()`. Le colonne sono `timestamptz`, la conversione al fuso dello studio avviene solo nello strato http. La promozione dalla lista d'attesa avviene nella stessa transazione della cancellazione.  
> Alternative scartate: mock globale del tempo nei test, perché fragile e nascosto.  
> Conseguenze: test deterministici. Una firma in più da passare.

> **ADR-005: Fastify e Vitest, Postgres in Docker per i test di integrazione**  
> Stato: proposto  
> Contesto: serve uno stack HTTP e una strategia di test, dato che la concorrenza va verificata su un Postgres vero.  
> Decisione: Fastify con validazione degli input tramite JSON Schema. Vitest per i test, unitari sul dominio e di integrazione su un Postgres avviato con `docker compose`.  
> Alternative scartate: Express, perché senza validazione e tipi nativi. Jest, perché più lento e meno semplice con TypeScript ed ESM. SQLite nei test, perché non ha `FOR UPDATE`.  
> Conseguenze: i test di concorrenza sono realistici. Serve Docker in locale e in CI.

## Architettura

`http → applicazione → dominio ← infrastruttura`. L'applicazione usa interfacce di repository definite accanto ai casi d'uso. L'infrastruttura le implementa con Kysely.

```
prenota/
├── src/
│   ├── dominio/          regole pure: capienza, cancellazione 12h, lista d'attesa
│   ├── applicazione/     casi d'uso: prenota, cancella, gestisci corso
│   ├── infrastruttura/   Kysely, repository, migrazioni
│   ├── http/             rotte Fastify, schemi di validazione
│   └── server.ts         avvio e cablaggio
├── test/
│   └── integrazione/     test su Postgres reale, concorrenza inclusa
├── docker-compose.yml    Postgres locale e di test
└── .pebble/              bootstrap, architettura, decisioni
```

I test unitari stanno accanto al file (`*.test.ts`).

## Roadmap

1. **Setup:** TypeScript, Vitest e un test verde sulla regola delle 12h, senza database. Si fa in una sessione.
2. **Dominio:** capienza, lista d'attesa e promozione come funzioni pure, tutte testate.
3. **Database:** `docker compose`, schema e prime migrazioni Kysely (corsi, iscritti, prenotazioni).
4. **Caso d'uso "prenota"** con transazione e `FOR UPDATE`, più un test di integrazione con 20 prenotazioni parallele su 10 posti: ne passano esattamente 10.
5. **Caso d'uso "cancella"**: rimborso o meno e promozione dalla lista d'attesa nella stessa transazione.
6. **API HTTP:** rotte iscritti e staff, validazione e codici di errore coerenti.
7. **Autorizzazione** iscritto/staff.
8. **Prova di carico** sullo scenario del lunedì alle 7:00, con misura della latenza.

## Da dove cominciare

Dal passo 1, partendo da `src/dominio/cancellazione.ts` e dal suo test. È la regola più chiara del bootstrap e non richiede database. Ti obbliga subito ad applicare l'ADR-004 (orologio iniettato). Quando vuoi partire, ti do i comandi e il `tsconfig.json` completi.
