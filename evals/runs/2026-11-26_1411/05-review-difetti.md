Il file mescola dominio e infrastruttura: le regole sono giuste, ma stanno nel posto sbagliato e usano strumenti che il dominio non deve toccare.

> **[errore] riga 1 · ADR-002, ADR-003**  
> Problema: `domain/booking.ts` importa `pg`, crea un `Pool` ed esegue SQL. Inoltre la SELECT e la INSERT sono separate e fuori transazione.  
> Perché: ADR-002 vieta l'I/O nel dominio e ADR-003 mette l'SQL in `infra/`. Il lunedì alle 7:00 (bootstrap › Vincoli) due richieste leggono lo stesso `booked` e superano entrambe la capienza.  
> Try: sposta le query in un adapter `infra/` dietro una porta dichiarata in `domain/`. Il caso d'uso in `application/` apre la transazione, blocca la riga del corso (`SELECT … FOR UPDATE`) e solo dopo chiede al dominio di decidere.

> **[errore] riga 11 · ADR-002**  
> Problema: con il corso pieno il codice fa `throw new Error('full')`. Se l'`id` non esiste, `course` è `undefined` e la riga 10 va in crash.  
> Perché: ADR-002 vuole gli esiti previsti come valori di ritorno. "Pieno" è anche la porta d'ingresso della lista d'attesa (bootstrap › Vincoli), quindi non è un errore.  
> Try: una funzione pura che riceve il corso già letto e restituisce un esito discriminato (vedi sotto). Il caso "corso inesistente" lo gestisce l'application prima di chiamarla.

> **[errore] riga 16 · ADR-002**  
> Problema: `canCancel` legge `Date.now()`.  
> Perché: il dominio non deve leggere l'orologio di sistema (ADR-002). In più non puoi testare il confine delle 12 ore senza manipolare l'ora della macchina.  
> Try: aggiungi un parametro `now: Date`, passato dall'application tramite un adapter orologio in `infra/`. Come test, prova con `startsAt` esattamente 12 ore dopo `now` e decidi se il risultato deve essere `true` o `false`.

Forma proposta per `domain/` (zona B):

```ts
export type Course = { id: string; capacity: number; booked: number }

export type BookingOutcome =
  | { kind: 'confermata' }
  | { kind: 'lista_attesa'; position: number }

export declare function decideBooking(course: Course, waitlistLength: number): BookingOutcome
export declare function canCancel(startsAt: Date, now: Date): boolean

export interface BookingRepository {
  inTransaction<T>(work: (tx: BookingRepository) => Promise<T>): Promise<T>
  lockCourse(courseId: string): Promise<Course | null>
  waitlistLength(courseId: string): Promise<number>
  saveBooking(courseId: string, memberId: string, outcome: BookingOutcome): Promise<void>
}
```

Domanda: quando il corso è pieno, l'iscritto finisce in lista d'attesa automaticamente o deve chiederlo in modo esplicito? Dalla risposta dipende se `lista_attesa` è un esito di `decideBooking` oppure un caso d'uso separato.
