# Prenota: proposta iniziale

## 1. Lettura del bootstrap

Un'API REST per uno studio fitness con due ruoli: gli iscritti prenotano e cancellano, lo staff gestisce corsi e capienza. Il punto critico non è il CRUD ma la **concorrenza**: il lunedì alle 7:00 molte richieste arrivano insieme sugli stessi posti. Le regole di dominio sono il limite delle 12 ore e la lista d'attesa. Per partire c'è abbastanza; l'unico punto aperto lo trovi in fondo.

---

## 2. Decisioni proposte

```
## ADR-001: Capienza garantita dal database, non dall'applicazione
Stato: proposto
Contesto: Al picco del lunedì 7:00 molte richieste concorrenti competono per gli stessi
posti. Con un "leggo i posti liberi, poi inserisco" in due passi, due richieste
leggono "1 posto libero" ed entrano entrambe: overbooking.
Decisione: Ogni prenotazione avviene in una transazione che blocca la riga della
sessione (SELECT ... FOR UPDATE), conta i confermati, poi inserisce la prenotazione
come "confermata" o "in attesa". Un vincolo UNIQUE (iscritto, sessione) impedisce
doppie prenotazioni anche in caso di doppio click o retry.
Alternative scartate:
- Controllo solo applicativo: race condition garantita sotto carico.
- Contatore in Redis o coda esterna: un'infrastruttura in più per un volume che
  Postgres regge senza problemi (il lock è per singola sessione, non globale).
- Isolamento SERIALIZABLE su tutto: funziona, ma richiede una logica di retry
  ovunque. Il lock mirato è più semplice da capire.
Conseguenze: la correttezza non dipende dal numero di istanze dell'API. Le
prenotazioni sulla stessa sessione vengono serializzate: va bene, le transazioni
sono brevi. Servono test di integrazione su un Postgres vero, i mock non bastano.
```

```
## ADR-002: Kysely come query builder tipizzato, niente ORM completo
Stato: proposto
Contesto: Il bootstrap chiede se usare un ORM. ADR-001 richiede controllo esplicito
su transazioni e lock di riga.
Decisione: Kysely per le query (tipizzate in TypeScript, SQL leggibile), migrazioni
versionate nel repository.
Alternative scartate:
- Prisma: ottimo per il CRUD, ma FOR UPDATE e transazioni interattive richiedono
  SQL grezzo o workaround, proprio nel punto più delicato del progetto.
- TypeORM: decoratori, lazy loading e comportamenti impliciti che nascondono
  le query.
- Driver pg puro: massimo controllo ma nessun tipo, quindi errori a runtime.
Conseguenze: vedi esattamente quale SQL parte e i tipi delle tabelle restano
allineati allo schema. Tocca a te scrivere qualche query in più a mano, e i
repository li costruisci tu.
```

```
## ADR-003: Architettura a livelli con dominio puro
Stato: proposto
Contesto: Il bootstrap chiede come strutturare le cartelle. Le regole (12 ore,
lista d'attesa) devono essere testabili in millisecondi, senza database né HTTP.
Decisione: Quattro livelli con dipendenze a senso unico:
http → application → domain, e infrastructure → application/domain.
Il dominio non importa nulla da Kysely, Fastify o altre librerie esterne.
Alternative scartate:
- Tutto nelle route: veloce all'inizio, ma ogni regola diventa testabile solo via HTTP.
- Hexagonal/DDD completo: troppa cerimonia per due aggregati.
Conseguenze: test unitari rapidi sulle regole e la possibilità di cambiare il
framework HTTP senza toccare la logica. Alcune interfacce (repository, clock)
vanno definite esplicitamente.
```

```
## ADR-004: Il tempo è un'istanza UTC con orologio iniettato
Stato: proposto
Contesto: La regola delle 12 ore dipende dall'ora corrente. Lo studio lavora in
Europe/Rome e il cambio dell'ora legale fa sbagliare i calcoli su date "locali".
Decisione: Tutti gli orari sono salvati come timestamptz (UTC). Le 12 ore si calcolano
come differenza tra istanti. L'ora corrente arriva da una dipendenza Clock passata
ai casi d'uso, mai da `new Date()` dentro il dominio.
Alternative scartate: date locali senza fuso (bug a marzo e ottobre); orologio
globale (test non deterministici sul confine delle 12 ore).
Conseguenze: puoi testare "11h59m prima" ed "esattamente 12h prima" in modo
deterministico. La conversione al fuso dello studio resta solo nel livello http.
```

```
## ADR-005: Promozione dalla lista d'attesa automatica e nella stessa transazione
Stato: proposto
Contesto: Quando un confermato cancella, il posto va al primo in attesa. Se la
promozione avviene in un secondo momento, nel frattempo il posto può essere preso
da una nuova prenotazione.
Decisione: La cancellazione di un confermato e la promozione del primo in attesa
(FIFO, per data di prenotazione) avvengono nella stessa transazione, con lo stesso
lock di ADR-001. Una prenotazione ha uno stato: confermata | in_attesa | cancellata.
Le notifiche all'utente promosso sono fuori scope per ora.
Alternative scartate: job periodico che promuove (finestra di incoerenza); offerta
del posto con conferma entro X minuti (più complessa, nessun requisito la chiede).
Conseguenze: la capienza resta sempre coerente. Diventa più difficile aggiungere
in seguito una notifica affidabile: quando servirà, valuta un outbox (nuovo ADR).
```

---

## 3. Architettura

**Livelli e dipendenze**

```
http  ──►  application  ──►  domain
                ▲                ▲
                └── infrastructure ┘
```

- **domain**: regole pure (policy di cancellazione, decisione confermata/in attesa, scelta di chi promuovere). Nessun I/O.
- **application**: casi d'uso (prenota, cancella, crea sessione, cambia capienza). Orchestrano transazioni tramite interfacce.
- **infrastructure**: Kysely, repository concreti, migrazioni, Clock reale.
- **http**: route, validazione input, autenticazione e ruoli, mappatura degli errori in status code.

**Cartelle**

```
src/
  domain/            regole e tipi del dominio, zero dipendenze esterne
  application/       casi d'uso e interfacce (repository, clock, unit of work)
  infrastructure/
    db/              connessione Kysely, repository, tipi generati
    migrations/      migrazioni SQL versionate
  http/              server, route, schemi di validazione, middleware auth
  config/            lettura e validazione delle variabili d'ambiente
test/
  integration/       test su Postgres reale (concorrenza, transazioni)
  load/              script per simulare il picco del lunedì
```

I test unitari stanno accanto ai file del dominio (`*.test.ts`).

---

## 4. Roadmap

1. **Policy di cancellazione pura.** Progetto TS e test runner configurati, funzione di dominio sulle 12 ore con test verdi, confini inclusi. *Verifica: `npm test` passa senza DB.*
2. **Schema e migrazioni.** Tabelle corsi, sessioni (con capienza), prenotazioni (con stato), vincolo UNIQUE (iscritto, sessione), indici. *Verifica: la migrazione gira da zero su un Postgres vuoto (es. via Docker).*
3. **Caso d'uso "prenota"** con lock (ADR-001). *Verifica: un test di integrazione lancia 50 prenotazioni concorrenti su una sessione da 20 posti e ottiene esattamente 20 confermate e 30 in attesa.*
4. **Caso d'uso "cancella" con promozione** (ADR-005). *Verifica: con cancellazione entro le 12 ore il primo in attesa diventa confermato; i test coprono anche il caso oltre le 12 ore.*
5. **Casi d'uso staff.** Crea corso o sessione, modifica capienza. *Verifica: i test coprono anche la riduzione della capienza sotto il numero di confermati.*
6. **Livello HTTP con autenticazione e ruoli.** *Verifica: un iscritto non può modificare la capienza, e gli errori di dominio arrivano come 4xx coerenti.*
7. **Test di carico del picco.** Script che simula l'apertura del lunedì. *Verifica: nessun overbooking, latenza p95 accettabile, nessun deadlock nei log.*

---

## 5. Da dove partire

**Passo 1: `src/domain/cancellation-policy.ts` con i suoi test.**
È piccolo, non richiede database né framework e copre il requisito più facile da sbagliare: il confine delle 12 ore, sotto ADR-004. Ti obbliga anche a configurare TypeScript e il test runner. Uno spunto di firma:

```ts
function isFreeCancellation(sessionStartsAt: Date, now: Date): boolean
```

Decidi tu se "esattamente 12 ore prima" conta come gratuita, poi fissalo in un test.

---

**Domanda:** cosa succede se un iscritto cancella *meno* di 12 ore prima? Viene addebitata una penale, si scala un ingresso dal carnet, o la cancellazione è proprio vietata? La risposta cambia il passo 4 e forse richiede un modello di "crediti" che oggi non c'è.
