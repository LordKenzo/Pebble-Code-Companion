Il file così com'è non ha posto in `domain/`: il nome dice "invia", e inviare una email è I/O. Va diviso in tre pezzi, uno per livello.

**Ruolo**
In `domain/` resta solo la parte pura: com'è fatta una email di conferma e il contratto (porta) di chi la spedisce. Lo spedire vero va in `infra/`, e il "quando spedire" va in `application/`.

**Dovrebbe**
- Definire il tipo `ConfirmationEmail` (destinatario, oggetto, testo) · `ADR-002`
- Costruire l'email a partire da una prenotazione, come funzione pura: dati in ingresso, valore in uscita · `ADR-002`
- Dichiarare l'interfaccia `EmailSender`, che `infra/` implementerà · `ADR-001`

**Non dovrebbe**
- Importare client SMTP, `fetch` o SDK di provider email · `ADR-002`
- Leggere l'orologio per scrivere data e ora nel testo: le riceve già dentro la prenotazione · `ADR-002`
- Decidere quando inviare, per esempio dopo il commit della transazione: è compito del caso d'uso in `application/` · `ADR-001`
- Lanciare eccezioni per esiti previsti come "indirizzo rifiutato": restituisce un valore · `ADR-002`

**Spunto**
Rinomina il file in `src/domain/confirmationEmail.ts`, perché descrive un concetto e non un'azione. `Booking` è il tipo di prenotazione che hai, o avrai, in `domain/`.

```ts
import type { Booking } from './booking';

export interface ConfirmationEmail {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

export type SendResult =
  | { readonly kind: 'sent' }
  | { readonly kind: 'rejected'; readonly reason: string };

export interface EmailSender {
  send(email: ConfirmationEmail): Promise<SendResult>;
}

export declare function buildConfirmationEmail(booking: Booking): ConfirmationEmail;
```

Gli altri due pezzi:
- `src/infra/smtpEmailSender.ts` implementa `EmailSender` con la libreria che sceglierai.
- `src/application/bookSeat.ts` (o come hai chiamato il caso d'uso "prenota") riceve un `EmailSender` iniettato. Dopo la prenotazione riuscita chiama `buildConfirmationEmail` e poi `send`.

Bonus: `buildConfirmationEmail` si testa senza mock, e il caso d'uso si testa con un `EmailSender` finto.

Se l'invio dell'email fallisce, la prenotazione deve restare valida o va annullata? La risposta decide se l'invio sta dentro o fuori dalla transazione (`ADR-003`). Vale la pena fissarla in un ADR.
