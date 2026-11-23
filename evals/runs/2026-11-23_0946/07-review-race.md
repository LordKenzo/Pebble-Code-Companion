Struttura dei livelli rispettata, ma la prenotazione non regge il picco del lunedì: oggi due richieste simultanee possono superare la capienza.

```
[errore] righe 11-19 · ADR-003, bootstrap › Vincoli (picchi lunedì 7:00)
Problema: leggi il corso, decidi in memoria e poi scrivi con due chiamate separate, senza transazione. Due richieste che leggono `booked = 9` su capienza 10 passano entrambe. In più `updateCourse` sovrascrive `booked` con un valore che potrebbe essere già vecchio, e se `saveBooking` riesce ma `updateCourse` fallisce il contatore resta sbagliato.
Perché: alle 7:00 del lunedì le richieste concorrenti sullo stesso corso sono la norma. L'overbooking è proprio il bug che lo staff vedrà per primo. ADR-003 prevede già un'interfaccia transazionale in domain, ma qui non viene usata.
Prova: esegui lettura, decisione e scrittura dentro un'unica unità di lavoro esposta dalla porta, ad esempio `repo.withTransaction(fn)`. Poi decidi come serializzare l'accesso al corso: lock sulla riga in lettura oppure update condizionale sulla capienza. Evita anche di passare l'intero oggetto `course` all'update: esprimi l'incremento come operazione, non come stato finale.
```

```
[avviso] righe 7, 15 · ADR-002
Problema: `clock` viene iniettato ma non lo usi mai. `book(course, member)` non riceve l'istante corrente.
Perché: per ADR-002 il dominio non può leggere l'orologio da solo, quindi l'ora deve passargliela l'application. Senza questo dato `book` non può rifiutare un corso già iniziato o non ancora aperto (l'apertura è lunedì alle 7:00). Inoltre i test sui limiti temporali diventano impossibili.
Prova: leggi `clock.now()` una volta all'inizio del caso d'uso e passalo a `book` come parametro esplicito. Il cancella farà lo stesso per la regola delle 12 ore.
```

```
[info] riga 19 · bootstrap › Vincoli (lista d'attesa)
Problema: dopo un esito positivo incrementi sempre `booked`. Non si vede però dove passi la lista d'attesa: se `book` restituisce anche "messo in attesa", qui il contatore sale lo stesso.
Perché: la lista d'attesa è un requisito esplicito. Se l'application tratta ogni esito positivo come posto confermato, il contatore e la realtà divergono.
Prova: fai restituire a `book` un esito discriminato (confermato oppure in attesa) e fai dipendere le scritture dal tipo di esito, non dalla semplice assenza di errore.
```

**Domanda:** `booked` è una colonna salvata sul corso o la ricavi contando le prenotazioni? La risposta cambia la strategia di lock.

**ADR proposto:** *ADR-004: Strategia di concorrenza sulla capienza.* Serve per scegliere una volta sola tra lock di riga, update condizionale e conteggio in transazione. La stessa scelta servirà anche a cancella e alla promozione dalla lista d'attesa.
