Il flusso è chiaro e rispetta la direzione delle dipendenze (application importa solo da domain). Ci sono due problemi di comportamento e una parte del bootstrap non ancora coperta.

> **[errore] riga 11-19 · ADR-003, bootstrap › Vincoli**
> Problema: leggi il corso, controlli la capienza in `book()`, poi scrivi prenotazione e contatore in due chiamate separate, senza transazione né lock.
> Perché: il lunedì alle 7:00 arrivano molte richieste in parallelo sullo stesso corso. Due richieste possono leggere `booked = 9` su un corso da 10 posti e farne entrare 11. Se `saveBooking` riesce e `updateCourse` fallisce, la prenotazione esiste ma il contatore non si aggiorna.
> Prova: l'interfaccia `BookingRepository` deve esporre un'operazione transazionale (ADR-003 la mette in domain, l'adapter la implementa). Dentro la transazione leggi il corso con un lock di riga (`SELECT … FOR UPDATE`), poi scrivi entrambe le cose. Scrivi un test che lancia due prenotazioni concorrenti sull'ultimo posto e verifica che una sola passi.

> **[avviso] riga 7 e 15 · ADR-002**
> Problema: `clock` arriva come parametro ma non viene mai usato, e `book(course, member)` non riceve l'ora.
> Perché: la regola delle 12 ore per la cancellazione e il controllo "fuori tempo" dipendono dall'ora corrente. Il dominio non può leggere l'orologio (ADR-002), quindi l'ora va passata come dato.
> Prova: leggi `const now = clock.now()` in questo livello e passala a `book()` come argomento. Se la regola sull'orario non serve alla prenotazione (solo alla cancellazione), rimuovi `clock` da questa funzione per non lasciare un parametro morto.

> **[info] riga 16 · bootstrap › Vincoli**
> Problema: quando il corso è pieno, `bookCourse` restituisce semplicemente l'errore. La lista d'attesa non è ancora gestita.
> Perché: è un vincolo esplicito del bootstrap e il caso "pieno" è già intercettato qui, quindi è il punto naturale per agganciarla.
> Prova: decidi cosa succede al posto libero (una nuova operazione o un esito distinto come `waitlisted`) prima di scrivere altro in questo file.

Vuoi che ragioniamo sul disegno della lista d'attesa come prossimo passo, prima di toccare la transazione?
