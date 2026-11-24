## Lettura del bootstrap

Un'API REST in Node + TypeScript su Postgres. Gli iscritti prenotano e cancellano, lo staff gestisce corsi e capienza. Il punto delicato è la concorrenza: il lunedì alle 7:00 molti iscritti chiedono lo stesso ultimo posto nello stesso istante, e non deve esserci overbooking. Seguono la lista d'attesa e la regola delle 12 ore, che dipende da come gestisci il tempo.

## Decisioni proposte

> **ADR-001: Architettura a livelli con dominio puro**  
> Stato: proposto  
> Contesto: nel bootstrap chiedi come strutturare le cartelle. Le regole (12 ore, capienza, lista d'attesa) vanno testate senza database.  
> Decisione: quattro livelli. `domain` contiene funzioni e tipi puri, `application` i casi d'uso e le interfacce dei repository, `infrastructure` Postgres, `http` le rotte. Le dipendenze puntano solo verso il dominio.  
> Alternative scartate: cartelle per tipo tecnico (`controllers/`, `models/`), perché mescolano regole e SQL e la logica finisce nei controller.  
> Conseguenze: test del dominio veloci e senza database. In cambio scrivi qualche file in più.

> **ADR-002: Accesso ai dati con Drizzle ORM + `pg`**  
> Stato: proposto  
> Contesto: nel bootstrap chiedi se usare un ORM. La concorrenza richiede transazioni e lock espliciti (`SELECT … FOR UPDATE`).  
> Decisione: Drizzle. Lo schema è in TypeScript, le migrazioni si generano con `drizzle-kit` e i lock si fanno senza SQL grezzo.  
> Alternative scartate: Prisma, perché per i lock di riga serve SQL raw e il controllo sulle transazioni è minore. `pg` puro, perché perdi i tipi e devi scrivere le migrazioni a mano.  
> Conseguenze: hai SQL prevedibile e tipizzato. Drizzle è meno diffuso di Prisma, quindi trovi meno esempi.

> **ADR-003: Prenotazione atomica con lock sulla sessione**  
> Stato: proposto  
> Contesto: il picco del lunedì alle 7:00 (`bootstrap › Vincoli`). Due richieste simultanee sull'ultimo posto non devono confermarsi entrambe.  
> Decisione: ogni prenotazione e ogni cancellazione girano in una transazione che blocca la riga della sessione (`FOR UPDATE`), conta i confermati e poi decide tra "confermata" e "in attesa". La promozione dalla lista d'attesa avviene nella stessa transazione della cancellazione. Un vincolo `UNIQUE (session_id, member_id)` impedisce le prenotazioni doppie.  
> Alternative scartate: una coda asincrona, troppo complessa per il volume di uno studio. Il lock ottimistico con retry, che sotto picco genera molti conflitti sulla stessa riga.  
> Conseguenze: la correttezza è garantita dal database. Le richieste sulla stessa sessione vengono servite in serie, che a questi volumi va bene.

> **ADR-004: Tempo in UTC e orologio iniettato**  
> Stato: proposto  
> Contesto: la regola "gratuita fino a 12 ore prima" va testata sul confine e deve reggere il cambio dell'ora legale.  
> Decisione: le colonne usano `timestamptz` e il codice ragiona in UTC. I casi d'uso ricevono un `Clock` invece di leggere l'ora corrente da soli. La regola delle 12 ore è una funzione pura del dominio. Al confine esatto (12 ore precise) la cancellazione è gratuita.  
> Alternative scartate: orari locali senza fuso, che sbagliano di un'ora due volte l'anno.  
> Conseguenze: test deterministici sul confine. Conversione al fuso locale solo in output.

> **ADR-005: Fastify e Vitest, con test di integrazione su Postgres reale**  
> Stato: proposto  
> Contesto: servono validazione delle richieste, buone prestazioni sotto picco e test che verifichino davvero i lock.  
> Decisione: Fastify con schemi JSON per la validazione. Vitest per tutti i test. I test di integrazione girano su un Postgres avviato con `docker compose`.  
> Alternative scartate: Express, che non ha validazione integrata ed è più lento. I mock del database, perché non dimostrano nulla sulla concorrenza.  
> Conseguenze: hai fiducia reale nei lock. In cambio Docker diventa necessario in sviluppo.

## Architettura

`http` dipende da `application`. `application` dipende da `domain`. `infrastructure` implementa le interfacce definite in `application`. `domain` non importa nulla.

```
prenota/
├── src/
│   ├── domain/          regole pure: capienza, lista d'attesa, regola 12 ore
│   ├── application/     casi d'uso (prenota, cancella, gestisci corso) e interfacce repository
│   ├── infrastructure/
│   │   └── db/          schema Drizzle, connessione, repository Postgres
│   ├── http/            rotte Fastify, schemi di validazione, mapping errori
│   └── main.ts          avvio e composizione delle dipendenze
├── drizzle/             migrazioni generate
├── test/
│   ├── unit/            test del dominio
│   └── integration/     test su Postgres reale, inclusa la concorrenza
├── docker-compose.yml
└── package.json
```

## Roadmap

1. **Setup.** Inizializzare npm, TypeScript e Vitest. Fatto quando `npm test` passa con un test banale.
2. **Regola delle 12 ore.** Funzione pura nel dominio. Fatto quando passano i test su 13h, 12h esatte e 11h59.
3. **Database.** `docker compose` con Postgres e schema Drizzle per corsi, sessioni e prenotazioni. Fatto quando la migrazione è applicata.
4. **Prenota.** Caso d'uso con transazione e lock (ADR-003). Fatto quando, con 2 richieste parallele su 1 posto, una risulta confermata e una in attesa.
5. **Cancella e promozione.** Fatto quando la cancellazione libera il posto al primo in lista d'attesa, nella stessa transazione.
6. **API HTTP.** Rotte Fastify per iscritti e staff, con validazione. Fatto quando i test di integrazione HTTP sono verdi.
7. **Prova di picco.** Test di carico che simula il lunedì alle 7:00. Fatto quando c'è zero overbooking e le latenze sono accettabili.

## Da dove partire

Dal **passo 1**, chiuso subito dal primo test vero, cioè quello sulla regola delle 12 ore in `src/domain/`.

Perché proprio questo: è piccolo, non richiede Docker né database, e ti obbliga a decidere il confine esatto della regola prima di scrivere qualsiasi SQL. È la regola più facile da sbagliare di un'ora o di un minuto, e da qui in poi ogni caso d'uso la riusa.

Quando vuoi, chiedimi i comandi e i file di configurazione del setup: te li do completi.
