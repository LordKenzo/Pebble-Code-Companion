# Test per `src/domain/booking.ts`

Prima i casi legati ai vincoli del bootstrap (finestra di 12 ore, lista d'attesa), poi il resto.

**`canCancel`**

1. `boundary`: **"esattamente 12 ore prima: cancellazione consentita"**. `startsAt` è a 12h00m da `now`. Fissa il significato di "fino a 12 ore prima" (`bootstrap › Vincoli`). Il tuo `>=` dice sì: il test lo rende una decisione esplicita.
2. `boundary`: **"11 ore e 59 minuti prima: cancellazione negata"**. È il lato opposto del confine e protegge da un `>=` che diventa `>` per sbaglio.
3. `edge`: **"corso già iniziato: cancellazione negata"**. Qui `startsAt` è prima di `now` e `hoursLeft` è negativo.
4. `basic`: **"due giorni prima: cancellazione consentita"**. È il caso normale.

**`book`**

5. `edge`: **"corso pieno: l'iscritto finisce in lista d'attesa"**. Qui `booked === capacity`. Oggi `book` restituisce `BookingError.courseFull`, mentre il bootstrap chiede una lista d'attesa (`bootstrap › Vincoli`). Scrivere questo test ti costringe a decidere cosa restituire: per esempio uno `status: 'waitlisted'`. Aspettati che sia rosso finché non cambi la funzione.
6. `boundary`: **"ultimo posto libero: prenotazione confermata"**. Qui `booked === capacity - 1`. È il confine esatto del controllo su `course.booked >= course.capacity`.
7. `basic`: **"corso con posti liberi: prenotazione confermata con courseId e memberId corretti"**. Verifica anche che i due id non siano invertiti.
8. `error`: **"corso con capienza zero: nessuna prenotazione confermata"**. Va in lista d'attesa o dà errore, secondo la scelta fatta al test 5.

**Da dove partire:** dal test 1. È puro e deterministico: passi due `Date` costruite a mano, senza orologio reale (`best practice`). Ti obbliga anche a chiarire il confine delle 12 ore prima di scrivere altro.

Nota: i picchi del lunedì alle 7:00 (`bootstrap › Vincoli`) non si testano qui. Il rischio è che due prenotazioni simultanee superino la capienza, e questo va gestito nel database con un vincolo o un lock. Servirà un test di integrazione su Postgres, non un test di questa funzione pura.

Domanda: quando il corso è pieno, `book` deve restituire una prenotazione con stato "in attesa" oppure un esito separato?
