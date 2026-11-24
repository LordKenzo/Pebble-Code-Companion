Il caso d'uso è leggibile e rispetta i livelli, ma sotto il picco del lunedì può prenotare oltre la capienza.

> **[errore] righe 11-19 · ADR-003, bootstrap › Vincoli**  
> Problema: la lettura del corso (riga 11) e le due scritture (righe 18-19) non sono nella stessa transazione e il corso non viene bloccato.  
> Perché: lunedì alle 7:00 due richieste leggono lo stesso `booked`, passano entrambe il controllo e il corso supera la capienza. Inoltre `booked + 1` può sovrascrivere un aggiornamento concorrente.  
> Prova: aggiungi la porta in `domain/ports` e fai girare tutto il caso d'uso dentro `withTransaction`. Nell'adapter apri la transazione con `BEGIN` e, in `findCourse`, leggi il corso con `SELECT … FOR UPDATE`.

```ts
export interface UnitOfWork {
  withTransaction<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>
}
```

> **[avviso] riga 19 · ADR-002**  
> Problema: l'incremento di `booked` è una regola di dominio, ma è scritto nel livello application.  
> Perché: con la lista d'attesa una prenotazione non sempre occupa un posto, e qui il contatore sale comunque. La regola finisce divisa tra due livelli.  
> Prova: fai restituire a `book` sia la prenotazione sia il corso aggiornato. L'application si limita a salvarli.

> **[info] riga 6 · ADR-002**  
> Problema: `clock` viene ricevuto ma non è mai usato.  
> Perché: il dominio non può leggere l'orologio, quindi regole come l'apertura delle prenotazioni del lunedì richiedono che l'istante gli venga passato.  
> Prova: leggi l'ora corrente da `clock` nel caso d'uso e passala a `book` come parametro `now`. Se `book` non ne ha bisogno, togli il parametro.

Quando il corso è pieno, oggi `book` restituisce un errore o un'iscrizione in lista d'attesa?
