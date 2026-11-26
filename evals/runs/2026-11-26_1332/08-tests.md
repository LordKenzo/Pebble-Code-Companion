## Casi di test per `src/domain/booking.ts`

1. **`edge`**: *book mette l'iscritto in lista d'attesa quando il corso è pieno.* Con `booked === capacity`, il bootstrap chiede la lista d'attesa (`bootstrap › Vincoli`). Oggi il codice restituisce `BookingError.courseFull`, quindi questo test parte rosso. È voluto: mostra che la regola manca.

2. **`boundary`**: *canCancel restituisce true quando mancano esattamente 12 ore all'inizio.* Il confronto è `>=`, quindi a 12h00m la cancellazione è ancora gratuita (`bootstrap › Vincoli`).

3. **`boundary`**: *canCancel restituisce false quando mancano 11 ore e 59 minuti.* È il gemello del caso 2. Insieme fissano il confine da entrambi i lati.

4. **`edge`**: *canCancel restituisce false quando il corso è già iniziato.* Con `now` dopo `startsAt`, `hoursLeft` è negativo. Va verificato che il risultato sia false e che il caso non passi per sbaglio.

5. **`basic`**: *book conferma la prenotazione quando ci sono posti liberi.* Con `booked < capacity` restituisce `courseId`, `memberId` e `status: 'confirmed'`.

6. **`boundary`**: *book conferma l'ultimo posto disponibile.* Con `booked === capacity - 1` la prenotazione è confermata, non va in lista d'attesa.

7. **`error`**: *book non conferma mai su un corso con capienza zero.* Con `capacity: 0` nessuno risulta confermato. Questo protegge da corsi creati male dallo staff.

**Picco del lunedì alle 7:00** (`bootstrap › Vincoli`): `book` legge `course.booked` da un oggetto già caricato. Due richieste simultanee possono quindi vedere entrambe l'ultimo posto libero. Un test di dominio non può coglierlo. Servirà un test d'integrazione su Postgres, con prenotazioni parallele sullo stesso posto, quando scriverai il layer di persistenza.

**Da dove partire:** dal caso 1. È l'unico che fallisce oggi, e scriverlo ti costringe a decidere come rappresentare la lista d'attesa, per esempio con un nuovo valore di `status` in `Booking`. Poi passa ai casi 2 e 3, che sono rapidi e fissano la regola delle 12 ore.
