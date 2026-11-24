Il flusso è quello giusto per un caso d'uso, ma la scrittura non è atomica e una regola di dominio è finita nel livello application.

> **[errore] righe 11-19 · ADR-003, bootstrap › Vincoli**  
> Problema: leggi `course`, poi `saveBooking` e `updateCourse` girano come operazioni separate, senza transazione.  
> Perché: lunedì alle 7:00 due richieste leggono lo stesso `booked` e prenotano entrambe l'ultimo posto. Il risultato è un overbooking. Se fallisce `updateCourse`, resta una prenotazione orfana.  
> Prova: aggiungi in `domain/ports` una porta transazionale che l'adapter implementa con `SELECT … FOR UPDATE` sul corso. Poi esegui lettura e scritture dentro `withTransaction`:
> ```ts
> export interface UnitOfWork {
>   withTransaction<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>
> }
> ```

> **[avviso] riga 19 · ADR-002, bootstrap › Vincoli**  
> Problema: `booked + 1` è una regola di dominio calcolata in application, e viene applicata a qualunque `result`.  
> Perché: se il corso è pieno e `book` mette l'iscritto in lista d'attesa, conti comunque un posto occupato.  
> Prova: fai restituire a `book` sia l'esito sia il corso aggiornato. Così application salva soltanto, senza decidere niente.

> **[info] righe 7, 15 · ADR-002**  
> Problema: `clock` viene ricevuto ma non è usato, e `book` non conosce l'ora corrente.  
> Perché: il dominio non legge l'orologio di sistema, quindi senza un `now` passato da fuori non può rifiutare un corso già iniziato o non ancora aperto.  
> Prova: passa a `book` il valore letto da `clock` come parametro.

Domanda: la lista d'attesa la gestisce `book`, oppure pensi a un caso d'uso separato?
