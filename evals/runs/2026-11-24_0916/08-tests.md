**Test per `src/domain/booking.ts`**

Prima i casi legati alle regole del bootstrap (cancellazione a 12 ore, lista d'attesa), poi il resto.

1. **`boundary`**: "esattamente 12 ore prima dell'inizio: la cancellazione è gratuita". Fissa il confine del `>=` in `canCancel` (bootstrap › Vincoli).
2. **`boundary`**: "11 ore e 59 minuti prima: la cancellazione non è più gratuita". Insieme al test precedente, blocca il confine da entrambi i lati.
3. **`edge`**: "corso pieno: l'iscritto finisce in lista d'attesa, non riceve un errore". Oggi `book` restituisce `BookingError.courseFull`, mentre il bootstrap chiede la lista d'attesa. Questo test nasce rosso, ed è giusto così.
4. **`boundary`**: "un posto libero (booked = capacity - 1): prenotazione confermata". È l'ultimo posto, lo scenario tipico del picco del lunedì alle 7:00.
5. **`edge`**: "corso già iniziato (now dopo startsAt): la cancellazione non è gratuita". In questo caso `hoursLeft` è negativo, e il test lo rende esplicito.
6. **`basic`**: "corso con posti liberi: prenotazione confermata con courseId e memberId dell'iscritto".
7. **`basic`**: "24 ore prima dell'inizio: la cancellazione è gratuita".
8. **`error`**: "corso con capienza 0: nessuna prenotazione confermata". Copre un dato anomalo inserito dallo staff.

**Da dove partire:** dal test 1. `canCancel` è una funzione pura, quindi il test non richiede setup. In più tocca una regola esplicita del bootstrap. Usa date costruite a mano (es. `startsAt` alle 19:00, `now` alle 7:00 dello stesso giorno) per evitare sorprese dovute al fuso orario.

**Nota sul test 3:** per far passare questo test, `book` deve poter restituire un esito diverso da `confirmed` senza passare per l'errore. È una scelta di dominio che conviene fissare in un ADR prima di scrivere il test.

Domanda: quando un iscritto cancella, il primo in lista d'attesa viene promosso a `confirmed` in automatico, oppure riceve una notifica e deve confermare entro un certo tempo? Dalla risposta dipende quali stati deve avere `Booking`.
