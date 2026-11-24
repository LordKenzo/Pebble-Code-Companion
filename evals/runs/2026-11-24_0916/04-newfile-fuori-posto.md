**Questo file, così com'è, non ha posto in `domain/`.** "Inviare" un'email è I/O, e ADR-002 lo esclude dal dominio: niente librerie di rete, niente effetti collaterali. Propongo di dividere la responsabilità in tre punti, ognuno nel suo livello (ADR-001).

**Ruolo**
In `domain/` resta solo la parte pura: *cosa* dice l'email di conferma e il *contratto* (porta) per spedirla. L'invio vero va in `infra/`, e la decisione di quando inviarla va in `application/`.

Rinomina il file in `src/domain/confirmationEmail.ts`. Il nome attuale descrive un'azione di I/O, quindi attira codice che qui non deve stare.

**Deve**
- Costruire il messaggio di conferma a partire da una prenotazione, come funzione pura: dati in ingresso, valore in uscita (ADR-002).
- Definire l'interfaccia `EmailSender`, che `infra/` implementerà. È lo stesso schema "porta in domain, adapter in infra" che ADR-003 usa per le transazioni.
- Esporre tipi semplici (`EmailMessage`), senza dipendenze da librerie.

**Non deve**
- Importare client SMTP, SDK di provider o `fetch` (ADR-002).
- Leggere l'orologio di sistema per la data nel testo. La data arriva dentro la prenotazione o come parametro (ADR-002).
- Chiamare `EmailSender`: è `application/prenota` che orchestra (ADR-001).
- Lanciare eccezioni per esiti previsti (ADR-002).

**Punto di partenza**

```ts
import type { Booking } from './booking.ts';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export function buildConfirmationEmail(booking: Booking): EmailMessage;
```

Ho ipotizzato che `Booking` esista in `domain/booking.ts`: adatta il percorso al tuo file reale.

Negli altri due livelli:
- `src/infra/smtpEmailSender.ts` implementa `EmailSender` con la libreria del provider scelto.
- `src/application/prenota.ts` riceve `EmailSender` come dipendenza e lo chiama dopo il salvataggio.

C'è anche un'ADR da valutare: **"Invio email dopo la prenotazione"**. Serve a decidere se l'invio avviene dentro o fuori dalla transazione, cioè se un'email fallita deve annullare la prenotazione o no.

**Domanda:** se l'email di conferma non parte, la prenotazione deve restare valida comunque? La risposta cambia la firma di `EmailSender.send` e il caso d'uso in `application/`.
