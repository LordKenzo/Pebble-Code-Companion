Il file mescola dominio e accesso a Postgres e legge l'orologio di sistema. Va diviso tra `domain/` e `infra/`.

> **[errore] riga 1-3, 7-12 · ADR-002, ADR-003**  
> Problema: `domain/booking.ts` importa `pg`, crea un `Pool` e scrive SQL.  
> Perché: con l'I/O dentro, il dominio non si testa senza un database. In più, la lettura di `booked` e l'`INSERT` non stanno in una transazione: con i picchi del lunedì alle 7:00 (`bootstrap › Vincoli`) due iscritti possono prendere l'ultimo posto.  
> Prova: lascia nel dominio una funzione pura che riceve lo stato del corso. Sposta query e transazione in un adapter in `src/infra/`, dietro un'interfaccia definita in `domain/` (ADR-003). Lì il posto va contato dentro la transazione, con la riga del corso bloccata.

> **[errore] riga 10 · ADR-002**  
> Problema: `throw new Error('full')` tratta un esito previsto come un'eccezione. Manca anche la lista d'attesa (`bootstrap › Vincoli`), e se il corso non esiste `course` è `undefined` (riga 9).  
> Perché: il caso d'uso in `application/` deve poter distinguere gli esiti senza `try/catch` e senza confrontare stringhe.  
> Prova: restituisci un tipo unione degli esiti, così:

```ts
export interface CourseSnapshot { id: string; capacity: number; booked: number }
export type BookingDecision =
  | { kind: 'booked' }
  | { kind: 'waitlisted' }
  | { kind: 'courseNotFound' };
export declare function decideBooking(course: CourseSnapshot | undefined): BookingDecision;
```

> **[errore] riga 16 · ADR-002**  
> Problema: `canCancel` usa `Date.now()`.  
> Perché: il risultato dipende da quando giri il test. Il caso limite delle 12 ore (`bootstrap › Vincoli`) non si può verificare in modo ripetibile.  
> Prova: `canCancel(startsAt: Date, now: Date): boolean`. L'orologio diventa un adapter in `infra/` e il caso d'uso passa `now`.

Proposta ADR: **ADR-004: strategia di concorrenza per le prenotazioni**. Va deciso tra lock sulla riga del corso e vincolo a livello di database, prima dei picchi del lunedì.

Domanda: a esattamente 12 ore dall'inizio la cancellazione è ancora gratuita? Oggi la riga 16 usa `>`, quindi risponde di no.
