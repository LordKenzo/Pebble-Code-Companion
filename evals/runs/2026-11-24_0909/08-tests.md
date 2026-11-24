# Casi di test per `src/domain/booking.ts`

**Cancellazione (`canCancel`)**

1. **limite**: "esattamente 12 ore prima: cancellazione gratuita consentita". Il bootstrap dice "fino a 12 ore prima", quindi il confine è incluso.
2. **limite**: "11 ore e 59 minuti prima: cancellazione gratuita non consentita". Basta un minuto sotto il confine per perdere il diritto.
3. **bordo**: "corso già iniziato: cancellazione non consentita". Qui `hoursLeft` è negativo.
4. **bordo**: "12 ore a cavallo del cambio dell'ora legale: contano le ore reali". Verifica che non entri in gioco l'ora del calendario locale.

**Prenotazione (`book`)**

5. **limite**: "corso pieno (booked uguale a capacity): l'iscritto va in lista d'attesa". Il bootstrap (`bootstrap › Vincoli`) chiede la lista d'attesa. Oggi `book` restituisce invece `BookingError.courseFull`, quindi questo test sarà rosso.
6. **limite**: "ultimo posto libero (booked = capacity − 1): prenotazione confermata".
7. **base**: "corso con posti liberi: prenotazione confermata con courseId e memberId del corso e dell'iscritto".
8. **errore**: "capienza zero: nessuna conferma, solo lista d'attesa". È il caso degenere di un corso configurato male dallo staff.

## Da dove partire

Comincia dal **5**. È l'unico che oggi fallisce, e per farlo passare devi decidere come `book` rappresenta "in lista d'attesa". Hai tre strade:

- un nuovo valore di `status` in `Booking`;
- un tipo di risultato distinto;
- una posizione in coda.

Questa scelta cambia la firma di `book` e quindi anche i test 6, 7 e 8. Conviene fissarla prima di scriverli.

Una nota a margine: con la firma attuale non puoi testare "lo stesso iscritto prenota due volte lo stesso corso", perché `book` non sa chi è già prenotato. Se è un requisito, va coperto a un altro livello, nel servizio o con un vincolo nel database.
