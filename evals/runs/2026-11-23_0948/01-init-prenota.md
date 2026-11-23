## 1. Lettura del bootstrap

Un'API REST per uno studio fitness con due ruoli: iscritti (prenotano e cancellano) e staff (gestisce corsi e capienza). La parte difficile è la correttezza sotto concorrenza: il lunedì alle 7:00 molte richieste arrivano insieme sugli stessi posti. Le regole di dominio sono tre: capienza, lista d'attesa e cancellazione gratuita entro 12 ore. Ho abbastanza informazioni per partire.

## 2. Decisioni proposte

> **ADR-001: Moduli per dominio, a livelli interni**  
> Stato: proposto  
> Contesto: "Come strutturare le cartelle". Il progetto ha due aree distinte: corsi e prenotazioni.  
> Decisione: un modulo per area (`courses`, `bookings`). Ogni modulo ha quattro livelli: http, service, domain, repository. HTTP con Fastify e validazione degli input tramite schema.  
> Alternative scartate: cartelle per tipo tecnico (tutti i controller insieme, tutti i model insieme), perché chi lavora su una regola deve saltare tra troppe cartelle. Express, perché la validazione degli schemi e la tipizzazione vanno aggiunte a mano.  
> Conseguenze: le regole stanno vicine al loro modulo. Bisogna però fare attenzione alle dipendenze tra moduli.

> **ADR-002: Query builder tipizzato al posto di un ORM**  
> Stato: proposto  
> Contesto: "Se usare un ORM". La capienza richiede transazioni e lock espliciti su Postgres.  
> Decisione: Kysely come query builder, con migrazioni in SQL versionate.  
> Alternative scartate: Prisma e TypeORM, perché nascondono il controllo su lock e transazioni, che qui è il punto critico. Il driver `pg` usato da solo, perché le query non sarebbero tipizzate.  
> Conseguenze: le query sono esplicite e verificabili. Scrivi un po' più di SQL e mantieni i tipi delle tabelle.

> **ADR-003: Capienza garantita dal database, non dall'applicazione**  
> Stato: proposto  
> Contesto: il picco del lunedì. Il pattern "conto i posti, poi inserisco" lascia passare overbooking quando due richieste arrivano insieme.  
> Decisione: ogni prenotazione avviene in una transazione che blocca la riga del corso (`SELECT … FOR UPDATE`), conta i confermati e decide lo stato. In più, un vincolo unico su (corso, iscritto) impedisce i doppioni.  
> Alternative scartate: una coda su Redis, troppo complessa per i volumi di uno studio fitness. Il lock ottimistico, perché sotto picco produce molti retry.  
> Conseguenze: la correttezza è garantita anche con più istanze dell'API. Le prenotazioni sullo stesso corso vengono servite una alla volta, cosa accettabile a questa scala.

> **ADR-004: Lista d'attesa come stato della prenotazione**  
> Stato: proposto  
> Contesto: quando il corso è pieno serve un ordine di attesa, e serve una promozione automatica quando qualcuno cancella.  
> Decisione: una sola tabella `bookings` con stato `confirmed`, `waitlisted` o `cancelled`. L'ordine è dato da `created_at`. La promozione del primo in attesa avviene nella stessa transazione della cancellazione, con lo stesso lock dell'ADR-003.  
> Alternative scartate: una tabella separata per la lista d'attesa, perché spostare righe tra tabelle aumenta i casi di errore. Un job asincrono di promozione, perché crea finestre di incoerenza.  
> Conseguenze: lo stato è sempre coerente. Le query devono sempre filtrare per stato.

> **ADR-005: Regole di dominio pure e orologio iniettato**  
> Stato: proposto  
> Contesto: la regola delle 12 ore dipende dall'ora corrente, e va testata senza aspettare il tempo reale.  
> Decisione: le regole (si può cancellare gratis? c'è posto?) sono funzioni pure nel livello domain. "Adesso" arriva come parametro. Tutti gli orari sono salvati in UTC (`timestamptz`).  
> Alternative scartate: chiamare `new Date()` dentro la logica, perché i test diventano fragili. Gli orari locali nel DB, perché il cambio dell'ora legale sposta la soglia delle 12 ore.  
> Conseguenze: i test sono veloci e deterministici. Il service deve sempre passare il clock.

## 3. Architettura

Le dipendenze vanno in una sola direzione: http → service → domain, e il service usa anche repository. Il livello domain non importa niente dagli altri. Solo il service apre le transazioni. Un modulo ne chiama un altro solo attraverso il suo service.

```
src/
  app/            avvio Fastify, config, registrazione moduli
  db/             connessione Kysely, tipi tabelle
  modules/
    courses/
      http/       route e schemi staff
      service/    casi d'uso corsi
      domain/     regole su capienza e orari
      repository/ query corsi
    bookings/
      http/       route iscritti
      service/    prenota, cancella, promuovi
      domain/     policy 12 ore, decisione confermato/attesa
      repository/ query con lock
  shared/         errori, clock, auth
migrations/       SQL versionato
test/
  integration/    test con Postgres reale, incluso concorrenza
```

## 4. Roadmap

1. Prepara il progetto: TypeScript, test runner e la policy di cancellazione nel livello domain con i suoi test, compreso il caso al limite delle 12 ore esatte.
2. Avvia Postgres in Docker e scrivi le migrazioni di `courses` e `bookings`, con i vincoli. È fatto quando le migrazioni girano da zero.
3. Implementa il CRUD dei corsi per lo staff. È fatto quando i test di integrazione passano.
4. Implementa la prenotazione con lock (ADR-003). È fatto quando un test con 50 richieste parallele su 10 posti produce esattamente 10 confermati e 40 in attesa.
5. Implementa la cancellazione con promozione dalla lista d'attesa. È fatto quando un test verifica la promozione e la distinzione tra cancellazione gratuita e tardiva.
6. Aggiungi l'autenticazione e i ruoli. È fatto quando un iscritto riceve 403 sulle route dello staff.
7. Esegui un test di carico che simula il lunedì alle 7:00. È fatto quando i tempi di risposta sono misurati e non ci sono errori.

## 5. Da dove partire

Parti da `src/modules/bookings/domain/`, con la policy di cancellazione gratuita e i suoi test. È la regola più chiara del bootstrap, non richiede database né framework, e ti obbliga subito a fissare la gestione del tempo dell'ADR-005, che userai ovunque.
