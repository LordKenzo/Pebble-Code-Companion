Il flusso e la dipendenza verso domain sono corretti. Il problema è la scrittura: non è atomica e non regge il picco del lunedì.

> **[errore] righe 11-19 · ADR-003, bootstrap › Vincoli**  
> Problema: leggi `course`, poi scrivi `saveBooking` e `updateCourse` separatamente, senza transazione.  
> Perché: lunedì alle 7:00 due richieste leggono lo stesso `booked` e prenotano entrambe l'ultimo posto. Se `updateCourse` fallisce dopo `saveBooking`, resta una prenotazione orfana.  
> Prova: definisci in `domain/ports` una porta transazionale (es. `withTransaction(fn)`). Racchiudi lettura e scrittura in quella porta e blocca la riga del corso nell'adapter.

> **[avviso] riga 19 · ADR-002**  
> Problema: `booked + 1` è una regola di dominio calcolata in application.  
> Perché: con la lista d'attesa, se il corso è pieno `book` probabilmente restituisce un'iscrizione in attesa. Il contatore però sale comunque.  
> Prova: fai restituire a `book` anche il nuovo stato del corso, oppure un esito distinto tra prenotazione confermata e attesa. In application salvi solo quello che ti dà il dominio.

> **[info] riga 7 · ADR-002**  
> Problema: `clock` è iniettato ma non lo usi mai.  
> Perché: il dominio non può leggere l'ora da solo, quindi `book` non può rifiutare un corso già passato o non ancora aperto.  
> Prova: passa `clock.now()` a `book` come parametro esplicito.

Domanda: in `book`, la lista d'attesa è un esito separato o un'eccezione `BookingError`?

ADR proposto: **ADR-004: Strategia di concorrenza sulla capienza** (lock pessimistico sulla riga del corso oppure `UPDATE … WHERE booked < capacity`), perché il picco del lunedì rende questa scelta strutturale.
