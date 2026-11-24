# Casi di test per `src/domain/booking.ts`

Il file contiene due funzioni pure, quindi si testano senza database. Tieni separati i casi di `canCancel` da quelli di `book`.

**`canCancel`**: cancellazione gratuita fino a 12 ore prima (`bootstrap › Vincoli`)

1. **"esattamente 12 ore prima: cancellazione consentita"** · `limite`
   Fissa la regola sul confine. Con `>=` "fino a 12 ore" include le 12 ore: il test rende esplicita questa scelta.
2. **"11 ore e 59 minuti prima: cancellazione rifiutata"** · `limite`
   È il lato opposto dello stesso confine. Usa un intervallo piccolo, così vedi che non si arrotonda.
3. **"24 ore prima: cancellazione consentita"** · `base`
4. **"corso già iniziato: cancellazione rifiutata"** · `bordo`
   Qui `startsAt` è precedente a `now` e le ore rimaste sono negative.

**`book`**: capienza e lista d'attesa (`bootstrap › Vincoli`)

5. **"ultimo posto libero: prenotazione confermata"** · `limite`
   Il corso ha `booked = capacity - 1`. È il caso che i picchi del lunedì alle 7:00 colpiranno più spesso.
6. **"corso pieno: iscritto messo in lista d'attesa"** · `limite`
   Il corso ha `booked = capacity`. Oggi questo test **fallisce**: il codice restituisce `BookingError.courseFull`, mentre il bootstrap chiede la lista d'attesa. Scrivilo comunque, perché segna un requisito non ancora coperto.
7. **"posti liberi: prenotazione confermata con courseId e memberId del corso e dell'iscritto"** · `base`
8. **"capienza zero: nessuna prenotazione confermata"** · `bordo`
   Copre un corso creato male dallo staff o chiuso.

**Da dove partire:** dal test 1, seguito subito dal 2. Sono i due casi che fissano la regola più facile da sbagliare. In più `canCancel` riceve `now` come parametro, quindi il test non dipende dall'orologio.

Il test 6 ti costringerà a decidere come `book` rappresenta la lista d'attesa: un nuovo `status`, oppure un tipo di ritorno diverso. Conviene fissarlo con un ADR prima di scrivere il codice. Proposta: **"ADR: esito della prenotazione su corso pieno"**, perché cambia il contratto di `book` e lo schema del database.
