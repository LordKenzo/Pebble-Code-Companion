# Test per `src/domain/booking.ts`

1. **`boundary`** · `canCancel restituisce true quando mancano esattamente 12 ore all'inizio`. Il vincolo dice "fino a 12 ore prima", quindi il confine è incluso. Il tuo `>=` va fissato con un test (bootstrap › Vincoli).

2. **`boundary`** · `canCancel restituisce false quando mancano 11 ore, 59 minuti e 59 secondi`. È il lato opposto dello stesso confine: un `>` scritto per errore al posto di `>=` lo rompe (bootstrap › Vincoli).

3. **`edge`** · `book su un corso pieno mette l'iscritto in lista d'attesa`. Oggi `book` restituisce `BookingError.courseFull`, mentre il bootstrap chiede la lista d'attesa. Questo test sarà rosso finché non decidi come `book` rappresenta lo stato "in attesa" (bootstrap › Vincoli).

4. **`boundary`** · `book conferma la prenotazione quando resta un solo posto (booked = capacity - 1)`. Verifica che l'ultimo posto vada a chi lo prende e non finisca in attesa.

5. **`basic`** · `book su un corso con posti liberi restituisce una prenotazione confermata con courseId e memberId corretti`.

6. **`edge`** · `canCancel restituisce false se il corso è già iniziato`. Copre il caso di `startsAt` nel passato, quindi con ore residue negative.

7. **`edge`** · `canCancel conta 12 ore reali anche a cavallo del cambio dell'ora legale`. `getTime()` lavora in millisecondi UTC, quindi il risultato dovrebbe già essere corretto. Il test lo rende esplicito: un corso alle 7:00 del giorno del cambio ha il limite in un orario "da orologio" diverso dal solito.

8. **`error`** · `book tratta come pieno un corso con booked maggiore di capacity`. Copre i dati incoerenti, per esempio quando lo staff riduce la capienza dopo che il corso ha già delle prenotazioni.

**Da dove partire:** dal test 1. È puro, passa subito e ti conferma che il setup dei test funziona. Poi passa al 3: è quello che ti costringe a una scelta sul tipo di ritorno di `book`.

I picchi del lunedì alle 7:00 (due prenotazioni sull'ultimo posto nello stesso istante) non si coprono qui: `book` riceve `course.booked` già letto. Quel caso va trattato in un test di integrazione con Postgres (bootstrap › Vincoli).
