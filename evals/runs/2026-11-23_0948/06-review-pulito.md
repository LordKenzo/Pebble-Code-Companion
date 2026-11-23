File in linea con ADR-002: niente orologio di sistema, esiti come valori. Il confine delle 12 ore esatte cade su `free`, coerente con "fino a 12 ore prima".

> **[info] riga 11 · generale**  
> Problema: `booking` non viene usato.  
> Perché: chi chiama deve passarlo senza che serva, e non si capisce se la funzione ne terrà conto.  
> Prova: toglilo, oppure usalo per gestire gli stati in cui la cancellazione non ha senso.

Domanda: una prenotazione già cancellata, o ancora in lista d'attesa, deve passare da questa funzione, o la scarta prima il livello application?
