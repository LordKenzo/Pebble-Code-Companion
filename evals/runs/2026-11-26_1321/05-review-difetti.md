Il file mescola dominio e infrastruttura: SQL, connessione e orologio vivono in `domain/`, e la prenotazione non regge i picchi del lunedì.

> **[errore] riga 1 · ADR-002, ADR-003**  
> Problema: `domain/booking.ts` importa `pg`, crea il `Pool` e scrive SQL.  
> Perché: il dominio deve essere puro e testabile senza database. L'SQL va negli adapter di `infra/`.  
> Try: in `domain/` tieni la regola "si può prenotare?" e definisci le porte. L'SQL va in `infra/postgres/`. Struttura proposta:

```ts
// src/domain/booking.ts
export type BookingOutcome =
  | { kind: 'confermata' }
  | { kind: 'listaAttesa' }
  | { kind: 'nonTrovato' };
export declare function decideBooking(course: Course): BookingOutcome;

// src/domain/ports.ts
export interface CourseRepository { findById(id: string): Promise<Course | null>; }
export interface BookingRepository { save(courseId: string, memberId: string): Promise<void>; }
export interface UnitOfWork { run<T>(work: () => Promise<T>): Promise<T>; }
```

> **[errore] righe 7-12 · bootstrap › Vincoli, ADR-003**  
> Problema: la `SELECT` e l'`INSERT` sono due query separate, senza transazione né lock.  
> Perché: il lunedì alle 7:00 due richieste leggono lo stesso `booked` e passano entrambe, quindi il corso va oltre la capienza. Inoltre `course` può essere `undefined`, e allora la riga 9 va in crash.  
> Try: il caso d'uso in `application/` esegue lettura e scrittura dentro `UnitOfWork.run`. L'adapter blocca la riga del corso finché la transazione non finisce. Il caso "corso non trovato" diventa un esito.

> **[errore] righe 10 e 16 · ADR-002**  
> Problema: con il corso pieno il codice lancia `throw new Error('full')`, e `canCancel` legge `Date.now()`.  
> Perché: gli esiti previsti devono essere valori di ritorno, e il dominio non legge l'orologio. Il bootstrap chiede inoltre la lista d'attesa, non un errore.  
> Try: fai restituire a `decideBooking` l'esito `listaAttesa`. Passa `now: Date` come parametro a `canCancel` e fornisci l'orologio da `infra/`. I test potranno così fissare l'ora a 11h59 e a 12h01 prima del corso.

Proposta di ADR: **ADR-004 · Concorrenza sulle prenotazioni**. Serve a fissare il meccanismo di lock (`SELECT … FOR UPDATE` sulla riga del corso), perché i picchi del lunedì lo rendono una decisione di progetto e non un dettaglio dell'adapter.
