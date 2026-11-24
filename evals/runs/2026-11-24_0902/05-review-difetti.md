Il file mescola dominio e accesso al database: va diviso tra `domain/` e `infra/`, come prevedono ADR-001 e ADR-002.

> **[errore] righe 1-12 · ADR-002, ADR-003**  
> Problema: `domain/` importa `pg` e scrive SQL. Inoltre la lettura di `booked` e l'`INSERT` non sono in una transazione.  
> Perché: il dominio non si può testare senza Postgres. Lunedì alle 7:00 due richieste leggono lo stesso `booked` ed entrambe inseriscono: il corso va oltre la capienza.  
> Prova: lascia qui solo la regola pura. La query e la transazione vanno in un adapter in `infra/`, chiamato da `application/`.

```ts
export interface CourseSnapshot { id: string; capacity: number; booked: number }
export type BookingDecision = { kind: 'booked' } | { kind: 'waitlisted' }
export function decideBooking(course: CourseSnapshot): BookingDecision
```

> **[errore] riga 10 · ADR-002 + bootstrap › Vincoli**  
> Problema: con il corso pieno lanci `throw new Error('full')`.  
> Perché: un corso pieno è un esito previsto, quindi va restituito come valore e non lanciato come eccezione. Il bootstrap chiede anche la lista d'attesa, che con l'eccezione sparisce.  
> Prova: restituisci un caso di `BookingDecision`. Il caso `course` mancante (riga 8, `rows[0]` può essere `undefined`) va gestito in application.

> **[errore] riga 16 · ADR-002**  
> Problema: `canCancel` legge `Date.now()`.  
> Perché: la regola delle 12 ore dipende dall'orologio di sistema. Non puoi testare il caso limite di "esattamente 12 ore prima" in modo ripetibile.  
> Prova: usa la firma `canCancel(startsAt: Date, now: Date): boolean`. `now` arriva dall'orologio in `infra/`, passando per application. Decidi anche se esattamente 12 ore conta come gratuita: oggi `>` la esclude.

Domanda: quando il corso è pieno, l'iscritto finisce in lista d'attesa in automatico o deve chiederlo lui?
