**Riepilogo:** il caso d'uso è ben separato dal dominio, ma la sequenza leggi-poi-scrivi non regge i picchi del lunedì.

> **[errore] righe 11-19 · ADR-003, bootstrap › Vincoli**  
> Problema: `findCourse`, `saveBooking` e `updateCourse` sono chiamate separate, fuori da qualsiasi transazione.  
> Perché: lunedì alle 7:00 due richieste leggono lo stesso `course.booked` e passano entrambe il controllo di capienza in `book`. Il risultato è overbooking, e un incremento va perso. Se `updateCourse` fallisce, resta inoltre una prenotazione senza contatore aggiornato.  
> Prova: definisci in `domain/ports` la porta transazionale prevista da ADR-003. Poi esegui lettura e scritture dentro la transazione, con la riga del corso bloccata dall'adapter (`SELECT … FOR UPDATE`).

```ts
export interface UnitOfWork {
  run<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>
}
```

> **[avviso] riga 19 · ADR-002**  
> Problema: `booked: course.booked + 1` è una regola di dominio calcolata nel livello application.  
> Perché: quando arriverà la lista d'attesa, questa riga incrementerà `booked` anche per chi finisce in coda. La regola rischia così di vivere in due posti.  
> Prova: fai restituire a `book` sia l'esito sia il corso aggiornato. Così `bookCourse` si limita a persistere quello che riceve.

> **[info] riga 7 · best practice**  
> Problema: `clock` viene passato ma non è mai usato.  
> Perché: un parametro inutilizzato fa pensare che il tempo conti nella prenotazione. Probabilmente conta: un corso già iniziato non dovrebbe essere prenotabile, e i corsi si aprono il lunedì alle 7:00.  
> Prova: passa `clock.now()` a `book` come dato, coerente con ADR-002. Se il tempo non serve, rimuovi il parametro.

**Domanda:** oggi `book` restituisce solo una prenotazione confermata, oppure anche un'iscrizione in lista d'attesa?
