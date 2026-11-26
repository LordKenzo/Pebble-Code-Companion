La separazione dei livelli è rispettata (ADR-001), ma la prenotazione non regge richieste contemporanee.

> **[errore] righe 11-19 · ADR-003, bootstrap › Vincoli**
> Problema: lettura, controllo, salvataggio e `booked + 1` avvengono senza transazione.
> Perché: il lunedì alle 7:00 due richieste leggono lo stesso `booked`: entrambe prendono l'ultimo posto e un incremento va perso. Se `updateCourse` fallisce, resta una prenotazione non contata.
> Prova: definisci in `domain/ports` un'operazione transazionale; l'adapter blocca la riga del corso (`SELECT … FOR UPDATE`) fino al salvataggio. Lettura e `book` stanno lì dentro.

> **[avviso] riga 18 · best practice**
> Problema: qui nulla garantisce che l'iscritto non abbia già prenotato il corso (a meno che `member` porti con sé le prenotazioni e `book` le controlli).
> Perché: un doppio clic o un nuovo tentativo nel picco può occupare due posti.
> Prova: vincolo univoco in Postgres su corso e iscritto, per le sole prenotazioni attive. L'adapter traduce la violazione in un esito restituito come valore (ADR-002).

> **[info] riga 7 · ADR-002**
> Problema: `clock` non è usato e `book` non riceve l'ora.
> Perché: il dominio non può rifiutare prenotazioni prima dell'apertura o a corso già iniziato.
> Prova: passa a `book` l'istante letto da `clock`.

**Proposta ADR-004, "Concorrenza sulle prenotazioni con lock di riga":** serializza le richieste solo sullo stesso corso ed evita l'overbooking durante il picco.

Quando il corso è pieno, `book` deve restituire un errore o un posto in lista d'attesa? Nel secondo caso la riga 19 non deve incrementare `booked`.
