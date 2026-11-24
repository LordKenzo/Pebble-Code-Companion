# Test per `src/domain/booking.ts`

Prima i casi legati alle regole del bootstrap: finestra di 12 ore e lista d'attesa.

**`canCancel`**

1. **`boundary`**: "esattamente 12 ore prima: cancellazione gratuita consentita". Il confine è incluso (`bootstrap › Vincoli`: "fino a 12 ore prima"). Il test fissa la scelta del `>=`.
2. **`boundary`**: "11 ore e 59 minuti prima: cancellazione non gratuita". Questo è il primo minuto fuori finestra. Se passa insieme al precedente, il confine è preciso.
3. **`edge`**: "corso già iniziato: cancellazione non consentita". Qui `startsAt` è prima di `now` e le ore rimaste sono negative. Il risultato atteso è `false`.
4. **`basic`**: "2 giorni prima: cancellazione gratuita consentita".

**`book`**

5. **`edge`**: "corso pieno: l'iscritto finisce in lista d'attesa". Il bootstrap chiede una lista d'attesa, non un rifiuto. Oggi `book` restituisce `BookingError.courseFull`, quindi questo test sarà rosso. Va bene così: ti mostra un requisito non ancora coperto (`bootstrap › Vincoli`).
6. **`boundary`**: "ultimo posto libero (prenotati = capienza − 1): prenotazione confermata". Il test controlla che il `>=` non tolga un posto.
7. **`error`**: "corso con prenotati oltre la capienza: nessuna conferma". Copre un dato incoerente, per esempio dopo che lo staff ha ridotto la capienza. Va deciso se finisce in attesa o in errore.
8. **`basic`**: "corso con posti liberi: prenotazione confermata con id del corso e dell'iscritto".

**Da dove partire:** dal test 1, "esattamente 12 ore prima". È una funzione pura, senza dipendenze, e fissa subito la regola più facile da sbagliare. Poi fai il 2, che lo completa.

Una cosa da tenere a mente: `canCancel` riceve `now` come parametro, ed è la scelta giusta (`best practice`). Nei test passa date costruite a mano in UTC. Non usare mai `new Date()` senza argomenti, altrimenti i test diventano instabili e dipendono dall'ora legale.

**Domanda:** quando un posto si libera, il primo in lista d'attesa viene confermato in automatico oppure riceve una proposta da accettare? La risposta cambia la forma del test 5 e il tipo restituito da `book`.
