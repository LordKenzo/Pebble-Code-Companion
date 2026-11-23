Casi di test per `src/domain/booking.ts`, con prima i limiti delle regole del bootstrap.

1. **`canCancel` restituisce true a esattamente 12 ore dall'inizio del corso** · `limite`
   Fissa la regola `bootstrap › Vincoli`. Il codice usa `>=`, quindi il test documenta che "fino a 12 ore prima" include le 12 ore esatte.

2. **`canCancel` restituisce false a 11 ore, 59 minuti e 59 secondi dall'inizio** · `limite`
   È l'altra faccia del confine. Senza questo test, un passaggio da `>=` a `>` non verrebbe notato.

3. **`book` mette l'iscritto in lista d'attesa quando il corso è pieno** · `limite`
   Il bootstrap chiede la lista d'attesa. Oggi `book` restituisce `courseFull`, quindi questo test fallisce. Va bene così: è il test che guida la funzionalità mancante.

4. **`book` conferma la prenotazione quando resta esattamente un posto** · `limite`
   Il caso è `booked === capacity - 1`. Protegge da errori di uno nel confronto.

5. **`book` restituisce una prenotazione confermata con `courseId` e `memberId` corretti** · `base`

6. **`canCancel` restituisce false se il corso è già iniziato** · `bordo`
   Con `startsAt` nel passato, `hoursLeft` diventa negativo. Il risultato è già corretto, ma conviene renderlo esplicito.

7. **`book` non conferma quando `booked` supera `capacity`** · `bordo`
   Copre i dati incoerenti, per esempio quando lo staff riduce la capienza dopo che il corso si è riempito.

8. **`canCancel` conta ore reali a cavallo del cambio di ora legale** · `bordo`
   Con `getTime()` funziona già. Il test serve a evitare che qualcuno in futuro "semplifichi" con un calcolo sulle ore di calendario.

**Da dove partire:** dal caso 1. Diventa verde subito e mette nero su bianco l'interpretazione della regola più ambigua del bootstrap. Subito dopo passa al caso 3, che resta rosso finché non decidi come modellare la lista d'attesa.

Nota a margine: il picco del lunedì alle 7:00 non si testa qui. `book` è pura e lavora su un `Course` già letto, quindi la concorrenza sull'ultimo posto andrà coperta con un test di integrazione sul livello che scrive su Postgres.

**Domanda:** in lista d'attesa vuoi che `book` restituisca un `Booking` con `status: 'waitlisted'`, oppure preferisci un tipo di esito separato? La scelta cambia la firma della funzione e quindi il caso 3.
