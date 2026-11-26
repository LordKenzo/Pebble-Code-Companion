Il caso d'uso è leggibile, ma scrittura non atomica e regole del dominio fuori posto lo rendono fragile proprio nel picco del lunedì.

> **[errore] riga 18-19 · ADR-003, bootstrap › Vincoli**  
> Problema: `saveBooking` e `updateCourse` sono due scritture separate. Inoltre `booked` viene letto alla riga 11 e riscritto alla 19 senza transazione.  
> Perché: lunedì alle 7:00 due richieste leggono lo stesso `booked`, entrambe passano il controllo di capienza e il corso va in overbooking. Se la seconda scrittura fallisce, resta una prenotazione senza contatore.  
> Prova: definisci in domain la porta transazionale prevista da ADR-003 e fai girare tutto il caso d'uso dentro di essa. L'adapter Postgres dovrà bloccare la riga del corso, oppure fare un update condizionato sulla capienza.

```ts
// src/domain/ports.ts
export interface UnitOfWork {
  run<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>
}
```

> **[avviso] riga 19 · ADR-001**  
> Problema: `course.booked + 1` è una regola del dominio scritta in application.  
> Perché: quando arriverà la lista d'attesa, il contatore non andrà sempre incrementato. La regola finirebbe divisa tra due livelli e i test di `book` non la coprirebbero.  
> Prova: fai restituire a `book` un esito che contenga già il corso aggiornato (o la posizione in attesa). Il caso d'uso deve solo salvare ciò che riceve.

> **[info] riga 7 · ADR-002**  
> Problema: `clock` è ricevuto ma mai usato, e `book` non riceve l'ora corrente.  
> Perché: il dominio non può sapere se il corso è già iniziato, o non ancora aperto alle prenotazioni. Per ADR-002 non può nemmeno leggere l'orologio da solo.  
> Prova: leggi l'ora con `clock` nel caso d'uso e passala come parametro a `book`. Se non serve, togli `clock` dalla firma.

Domanda: quando il corso è pieno, oggi `book` restituisce un `BookingError` o un esito "in lista d'attesa"?
