**Sintesi:** il file mescola dominio e accesso al database, quindi viola ADR-002. In più il controllo della capienza non regge il picco del lunedì.

> **[errore] riga 1-3, 7, 12 · ADR-002**  
> Problema: `domain/` importa `pg`, crea un `Pool` e fa query SQL.  
> Perché: il dominio deve restare puro. Altrimenti le regole (capienza, 12 ore) non si testano senza un Postgres attivo, e l'SQL finisce fuori da `infra/` (ADR-003).  
> Prova: in `domain/` tieni solo la regola, che riceve il corso già letto e restituisce un esito. Le query vanno in un adapter in `infra/`, chiamato dal caso d'uso in `application/prenota`.

> **[errore] riga 9-11, 15 · ADR-002**  
> Problema: `throw new Error('full')` usa un'eccezione per un esito previsto. `Date.now()` legge l'orologio di sistema.  
> Perché: ADR-002 vuole gli esiti come valori di ritorno e l'ora passata dall'esterno. Così il limite delle 12 ore si testa con date fisse.  
> Prova: una forma possibile per le firme:
> ```ts
> export type BookingOutcome =
>   | { kind: 'confermata' }
>   | { kind: 'lista-attesa' }
> export declare function decideBooking(booked: number, capacity: number): BookingOutcome;
> export declare function canCancel(startsAt: Date, now: Date): boolean;
> ```

> **[avviso] riga 7-12 · bootstrap › Vincoli**  
> Problema: prima leggi `booked`, poi fai `INSERT`, senza transazione né lock. Inoltre `booked` non viene incrementato, e se il corso non esiste `course` è `undefined`.  
> Perché: lunedì alle 7:00 molte richieste leggono lo stesso `booked` nello stesso momento. Risultato: il corso va oltre la capienza.  
> Prova: nell'adapter, fai lettura e scrittura nella stessa transazione, aperta tramite l'interfaccia definita in `domain` (ADR-003). Blocca la riga del corso con `SELECT … FOR UPDATE`, oppure usa un `UPDATE … WHERE booked < capacity` atomico.

**Proposta ADR:** ADR-004 "Strategia di concorrenza sulle prenotazioni", per scegliere tra lock pessimistico e update condizionale, visti i picchi del lunedì.

Quando il corso è pieno, l'iscritto va in lista d'attesa in automatico, oppure deve chiederlo lui?
