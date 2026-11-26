Hai scelto l'allenamento, quindi l'adapter non te lo scrivo nemmeno stavolta, ma in 20 minuti ti aiuto a chiuderlo.

Se `pg` non è già installato (ADR-003):

```sh
npm install pg
npm install -D @types/pg
```

**Gradino 3 · Esempio analogo**

Prestito dell'ultima copia di un libro, in `infra/`:

1. Prendi un client dal pool.
2. In un `try`, esegui `BEGIN` su quel client.
3. Leggi la riga del libro con `SELECT … FOR UPDATE`, così due richieste non prendono la stessa copia.
4. Conta i prestiti attivi e passa i dati al dominio, che decide.
5. Se l'esito è positivo fai l'`INSERT` e `COMMIT`; altrimenti `ROLLBACK` e restituisci l'esito.
6. Nel `catch` fai `ROLLBACK` e rilancia; nel `finally` rilascia il client.

**Checklist**
- La classe implementa l'interfaccia definita in `domain/`, e `pg` resta in `infra/` (ADR-001, ADR-002).
- Tutte le query di una transazione usano lo stesso client, non `pool.query` (ADR-003).
- I valori passano come parametri `$1`, `$2`, mai concatenati (best practice).
- Le righe SQL vengono convertite nei tipi del dominio, date comprese (ADR-001).
- "Corso pieno" è un valore di ritorno; gli errori del database restano eccezioni (ADR-002).

**Test:** con un solo posto libero, lancia due prenotazioni in parallelo: una riesce, l'altra riceve "corso pieno", e nella tabella c'è una sola riga in più.

**Per la demo:** parti solo dai metodi che mostrerai, un percorso felice alla volta, mantenendo query parametrizzate e rilascio del client.

Quali metodi ha `BookingRepository`? Incolla l'interfaccia e ti indico da quale partire.
