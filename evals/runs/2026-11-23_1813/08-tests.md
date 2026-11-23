# Test per `src/domain/booking.ts`

Funzioni pure senza I/O, quindi si testano senza mock e senza database.

**Casi**

1. `canCancel` restituisce true quando mancano esattamente 12 ore all'inizio · `limite`
   Il bootstrap dice "fino a 12 ore prima". Il tuo `>=` la considera una soglia inclusa. Il test rende esplicita questa scelta.

2. `canCancel` restituisce false quando mancano 11 ore, 59 minuti e 59 secondi · `limite`
   È l'altro lato della soglia. Se un giorno qualcuno cambia `>=` in `>` o arrotonda le ore, uno dei due test fallisce.

3. `book` conferma la prenotazione quando resta un solo posto (`booked = capacity - 1`) · `limite`

4. `book` mette l'iscritto in lista d'attesa quando il corso è pieno (`booked = capacity`) · `limite`
   Oggi **fallisce**: restituisce `courseFull`, ma `bootstrap › Vincoli` chiede la lista d'attesa. Scrivilo come test rosso, così ti segnala il requisito ancora scoperto. Il valore atteso dipende da te: per esempio lo stesso `Booking` con uno stato diverso da `'confirmed'`.

5. `canCancel` restituisce false per un corso già iniziato o passato · `bordo`
   Qui `hoursLeft` è negativo. Va bene così, ma è meglio che lo dica un test.

6. `canCancel` conta 12 ore reali a cavallo del cambio d'ora · `bordo`
   Prendi un corso alle 8:00 del 27 ottobre 2025 a Roma e un `now` alle 21:00 del giorno prima. Le ore che separano le due date sul calendario sono 11, ma quelle reali sono 12 per via del cambio d'ora. `getTime()` lavora in millisecondi assoluti e dovrebbe gestirlo. Il test protegge chi un domani passerà a ore "da orologio".

7. `book` rifiuta un corso con capienza 0 · `bordo`
   Copre un corso appena creato dallo staff e non ancora configurato.

8. `book` restituisce `courseId` e `memberId` presi dagli input · `base`

**Da dove partire**

Comincia dal **4**. È l'unico test che oggi fallisce e copre un requisito esplicito del bootstrap. Costringe anche a una decisione di dominio: come si rappresenta un posto in lista d'attesa? Uno `status` sul `Booking` o un'entità separata? Conviene chiarirlo prima di toccare il database.

Subito dopo scrivi la coppia 1+2. Sono due righe di setup ciascuno e fissano la regola dei rimborsi.

Una nota per più avanti: la gara del lunedì alle 7:00 (`bootstrap › Vincoli`) non si può testare qui. `book` riceve `course.booked` già letto, quindi due richieste concorrenti possono superare entrambe il controllo sulla capienza. Quel test andrà scritto nel livello che parla con Postgres.
