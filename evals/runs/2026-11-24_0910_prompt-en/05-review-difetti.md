**Sintesi:** il file mescola dominio e infrastruttura e contraddice ADR-002 su tre punti. La logica va separata dall'I/O prima di aggiungere altro.

> **[errore] riga 1 · ADR-002, ADR-003**  
> Problema: `domain/booking.ts` importa `pg`, crea un `Pool` ed esegue SQL.  
> Perché: il dominio deve restare puro, quindi testabile senza un database. Il SQL va negli adapter di `infra/`.  
> Prova: sposta le query in `src/infra/` e lascia nel dominio solo funzioni che ricevono dati e restituiscono un esito. Firme proposte qui sotto.

> **[errore] righe 9-12 · ADR-002, bootstrap › Vincoli**  
> Problema: per il corso pieno lanci `throw new Error('full')`. Manca la lista d'attesa. Lettura e insert non sono atomici.  
> Perché: il corso pieno è un esito previsto e va restituito come valore. Con i picchi del lunedì alle 7:00, due richieste possono leggere entrambe `booked < capacity` e superare la capienza.  
> Prova: restituisci un esito tipizzato (`confermata` oppure `in_lista_attesa`). Esegui lettura e insert in una transazione gestita dall'adapter (ADR-003), con un lock sulla riga del corso, ad esempio `SELECT … FOR UPDATE`. Gestisci anche il caso in cui il corso non esiste: alla riga 9 `course` può essere `undefined`.

> **[errore] riga 15 · ADR-002**  
> Problema: `canCancel` legge `Date.now()`.  
> Perché: il dominio non deve leggere l'orologio di sistema. Con `Date.now()` i test sul limite delle 12 ore cambiano risultato a seconda di quando li esegui.  
> Prova: passa `adesso: Date` come parametro e fai leggere l'orologio a un adapter in `infra/`.

Struttura proposta per `src/domain/booking.ts` (zona B):

```ts
export type EsitoPrenotazione =
  | { tipo: 'confermata' }
  | { tipo: 'in_lista_attesa' }
  | { tipo: 'corso_inesistente' }

export interface Corso {
  id: string
  capienza: number
  prenotati: number
  iniziaAlle: Date
}

export function decidiPrenotazione(corso: Corso): EsitoPrenotazione
export function puoCancellareGratis(iniziaAlle: Date, adesso: Date): boolean
```

**Domanda:** "fino a 12 ore prima" include il caso di esattamente 12 ore? Oggi `>` lo esclude.
