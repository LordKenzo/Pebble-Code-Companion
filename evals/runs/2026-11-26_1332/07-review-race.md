**Riepilogo:** il flusso è chiaro e gli esiti passano come valori (ADR-002 ✓), ma la scrittura non è atomica e reggerà male il picco del lunedì.

> **[errore] righe 11-19 · ADR-003, bootstrap › Vincoli**  
> Problema: leggi il corso, calcoli `booked + 1` e scrivi in due chiamate separate, senza transazione.  
> Perché: lunedì alle 7:00 due richieste leggono lo stesso `booked`, entrambe passano il controllo di capienza e il corso va in overbooking. Inoltre, se `updateCourse` fallisce, resta una prenotazione orfana.  
> Prova: definisci in `domain/ports.ts` una porta transazionale come prevede ADR-003. Nell'adapter Postgres, dentro la transazione, rileggi la riga del corso con `SELECT … FOR UPDATE`.

```ts
export interface UnitOfWork {
  run<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>;
}
```

> **[avviso] riga 19 · ADR-001, ADR-002**  
> Problema: `{ ...course, booked: course.booked + 1 }` è una regola di dominio scritta nel caso d'uso.  
> Perché: se `book` mette l'iscritto in lista d'attesa, il contatore sale lo stesso e la capienza si sporca. La logica su capienza e attesa deve vivere in un solo posto.  
> Prova: fai restituire a `book` sia la prenotazione sia il corso aggiornato. Il caso d'uso si limita a salvare ciò che riceve.

> **[info] riga 7 · ADR-002**  
> Problema: `clock` viene ricevuto ma non è mai usato, e `book` non riceve l'ora corrente.  
> Perché: il dominio non può leggere l'orologio, quindi oggi non può verificare le regole legate al tempo (corso già iniziato, apertura delle prenotazioni del lunedì).  
> Prova: passa `clock.now()` come argomento a `book`, così le regole temporali restano pure e testabili.

**Domanda:** quando il corso è pieno, `book` restituisce un `BookingError` oppure una voce di lista d'attesa? Da questo dipende cosa deve salvare il caso d'uso.
