Struttura dei livelli corretta, ma la prenotazione non regge i picchi e il tempo non arriva al dominio.

> **[errore] righe 11-19 · ADR-003, bootstrap › Vincoli**  
> Problema: lettura del corso, verifica e due scritture avvengono senza transazione.  
> Perché: lunedì alle 7:00 due richieste leggono lo stesso `booked` e superano la capienza. Inoltre `saveBooking` può riuscire e `updateCourse` fallire.  
> Prova: un'interfaccia in `domain/ports`. L'adapter apre la transazione e blocca la riga del corso in lettura (`FOR UPDATE`).
> ```ts
> export interface UnitOfWork {
>   run<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>
> }
> ```

> **[avviso] righe 7, 15 · ADR-002**  
> Problema: `clock` arriva come parametro ma non viene mai usato, e `book(course, member)` non riceve l'ora.  
> Perché: il dominio non può leggere l'orologio, quindi oggi non ha modo di rifiutare un corso già iniziato. La stessa regola servirà per le 12 ore della cancellazione.  
> Prova: in `bookCourse` leggi l'ora corrente da `clock` e passala a `book` come terzo parametro `now: Date`.

> **[avviso] riga 19 · ADR-002, bootstrap › Vincoli**  
> Problema: la regola "posti occupati +1" è calcolata nel caso d'uso.  
> Perché: con la lista d'attesa, se `book` mette l'iscritto in attesa, `booked` cresce lo stesso. La regola sulla capienza finisce divisa tra due livelli.  
> Prova: `book` restituisce sia la prenotazione sia il nuovo stato del corso, ad esempio `{ booking, course }`. L'application salva i due valori senza calcolare niente.

Proposta di ADR: **ADR-004: Concorrenza sulle prenotazioni**. Va scelto tra lock di riga e vincolo nel database, perché il picco del lunedì lo rende un requisito e non un dettaglio.
