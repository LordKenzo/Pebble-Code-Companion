Il file rispetta ADR-002: è puro, riceve `now` come parametro e restituisce gli esiti come valori. Il confine delle 12 ore è corretto.

> **[info] riga 11 · best practice**  
> Problema: `booking` è un parametro mai usato. L'esito dipende solo da `startsAt` e `now`.  
> Perché: chi chiama la funzione potrebbe pensare che lo stato della prenotazione venga controllato, ma non è così. Per esempio una prenotazione già cancellata o ancora in lista d'attesa riceverebbe comunque `free`.  
> Prova: decidi se lo stato della prenotazione fa parte di questa regola. Se sì, aggiungi un esito dedicato a `CancelOutcome`. Se no, togli il parametro e lascia quel controllo al livello application (ADR-001).

Cancellare un posto in lista d'attesa deve seguire la stessa regola delle 12 ore, o è sempre gratuito?
