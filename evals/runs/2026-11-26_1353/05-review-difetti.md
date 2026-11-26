`booking.ts` mescola SQL e regole dentro il dominio, e con più richieste insieme può superare la capienza.

> **[errore] riga 1 · ADR-002, ADR-003**
> Problema: `domain/` importa `pg`, crea un `Pool` ed esegue SQL.
> Perché: le regole non si possono testare senza Postgres e le dipendenze non puntano più verso il dominio.
> Prova: lascia qui solo funzioni pure (firme sotto). SQL in `infra/`, dietro un'interfaccia definita in `domain/`; il flusso "prenota" va in `application/`.

> **[errore] righe 7-12 · bootstrap › Vincoli (picchi del lunedì), ADR-003**
> Problema: leggi i posti e poi inserisci senza transazione; inoltre qui `booked` non viene mai aggiornato.
> Perché: alle 7:00 due richieste vedono lo stesso ultimo posto ed entrano entrambe.
> Prova: in un'unica transazione blocca la riga del corso (`SELECT … FOR UPDATE`), conta, decidi, scrivi.

> **[errore] righe 10 e 16 · ADR-002, bootstrap › Vincoli (12 ore)**
> Problema: "pieno" è un'eccezione, `canCancel` legge `Date.now()`, e con `>` a 12 ore esatte la cancellazione è rifiutata.
> Perché: "fino a 12 ore prima" include il limite.
> Prova: restituisci un esito, ricevi `now` come parametro, includi l'uguaglianza. Testa 12 ore esatte (sì) e 1 ms in meno (no).

Struttura che propongo per `src/domain/booking.ts`:

```ts
export type BookingOutcome =
  | { kind: 'confirmed' }
  | { kind: 'waitlisted' };

export declare function decideBooking(booked: number, capacity: number): BookingOutcome;
export declare function canCancel(startsAt: Date, now: Date): boolean;
```

**Proposta ADR-004**, concorrenza sulle prenotazioni: lock sulla riga del corso in transazione, perché è il modo più semplice per non superare la capienza durante i picchi.

Quando il corso è pieno, l'iscritto entra automaticamente in lista d'attesa (come ipotizzo nelle firme) o deve chiederlo?
