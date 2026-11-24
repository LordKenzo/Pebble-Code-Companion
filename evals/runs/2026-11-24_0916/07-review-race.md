Il caso d'uso è ben separato dal dominio, ma oggi può vendere più posti di quelli che ci sono.

> **[errore] righe 11-19 · ADR-003, bootstrap › Vincoli**  
> Problema: lettura del corso, `saveBooking` e `updateCourse` sono tre operazioni separate, senza transazione. In più `course.booked + 1` parte da un valore letto prima.  
> Perché: il lunedì alle 7:00 due richieste leggono lo stesso `booked`, passano entrambe il controllo e il corso finisce sopra capienza. Un aggiornamento si perde.  
> Prova: definisci la transazione in `domain/ports` (ADR-003) ed esegui tutto il caso d'uso dentro `run`, leggendo il corso con lock.

```ts
export interface UnitOfWork {
  run<T>(work: (repo: BookingRepository) => Promise<T>): Promise<T>
}
export interface BookingRepository {
  findCourseForUpdate(courseId: string): Promise<Course | null>
  // ...metodi esistenti
}
```

> **[avviso] righe 7, 15 · ADR-002**  
> Problema: `clock` arriva come parametro ma non viene mai usato, e `book(course, member)` non riceve l'istante corrente.  
> Perché: le regole di tempo (corso già iniziato, apertura delle prenotazioni del lunedì) finiscono fuori dal dominio. Oppure qualcuno le scrive leggendo `Date.now()` dentro `domain/`, e questo viola ADR-002.  
> Prova: leggi l'ora da `clock` nel caso d'uso e passala a `book` come parametro `now`.

> **[info] riga 19 · bootstrap › Vincoli**  
> Problema: il caso d'uso incrementa `booked` qualunque cosa sia `result`, quindi la regola di conteggio sta in application.  
> Perché: con la lista d'attesa, un iscritto in attesa non deve occupare un posto.  
> Prova: fai restituire a `book` un esito distinto, confermata o in attesa, insieme al corso aggiornato. Il caso d'uso salva soltanto quello che riceve.

Domanda: oggi `book` restituisce un `BookingError` quando il corso è pieno, oppure hai già previsto un esito "in lista d'attesa"?
