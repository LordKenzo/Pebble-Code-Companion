Questo file **non ha posto in `domain/`**: inviare un'email è I/O, e `domain/` non importa librerie di I/O (ADR-002). Dividiamolo in tre parti, una per livello.

**Ruolo**
In `domain/` resta solo ciò che è puro: il contratto del notificatore e la composizione del messaggio. Rinomina il file in `src/domain/conferma.ts`. Il nome "sendConfirmationEmail" descrive un'azione di I/O, mentre il dominio non invia nulla (ADR-002).
- L'invio vero va in un adapter in `src/infra/email/` (ADR-001, `architecture › infra`).
- Chi decide *quando* inviare è il caso d'uso `application/prenota` (ADR-001).

**Deve**
- Definire l'interfaccia (porta) `NotificatoreConferme`, che `infra` implementa. È lo stesso schema che ADR-003 usa per le transazioni.
- Definire il tipo `MessaggioConferma`, cioè i dati che servono per l'invio, indipendenti dal provider email.
- Esporre una funzione pura che, data una prenotazione, costruisce il messaggio. È testabile senza mock (ADR-002).

**Non deve**
- Importare client SMTP, `fetch` o SDK di provider (ADR-002).
- Leggere l'orologio di sistema per scrivere date nel corpo. Se servono, l'istante arriva come parametro (ADR-002).
- Decidere quando inviare o cosa fare se l'invio fallisce. Questo spetta al caso d'uso (ADR-001).
- Contenere HTML o template specifici di un provider. È un dettaglio di `infra` (`best practice`).

**Punto di partenza**

```ts
// src/domain/conferma.ts
import type { Prenotazione } from './prenotazione.ts'; // adatta al file dove vive il tipo

export interface MessaggioConferma {
  destinatario: string;
  oggetto: string;
  corpo: string;
}

export interface NotificatoreConferme {
  invia(messaggio: MessaggioConferma): Promise<void>;
}

export declare function componiConferma(prenotazione: Prenotazione): MessaggioConferma;
```

Nel caso d'uso `prenota` il notificatore arriva come dipendenza iniettata. In `infra/email/` scriverai un adapter che implementa `NotificatoreConferme`.

Una domanda che cambia la struttura: l'email va inviata **dopo il commit** della prenotazione, accettando che a volte possa non partire, oppure deve essere garantita? Nel secondo caso serve una tabella outbox scritta nella stessa transazione (`best practice`), e conviene salvarlo come ADR.
