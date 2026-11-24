**Questo file non ha posto in `domain/`.** "Inviare un'email" è I/O, e ADR-002 lo esclude dal dominio. Il dominio può però decidere *cosa* scrivere nell'email e *quale contratto* serve per inviarla. Ti propongo di dividere il lavoro in tre posti:

- `src/domain/confirmationEmail.ts` (questo file, rinominato): il tipo del messaggio, una funzione pura che lo compone e l'interfaccia `EmailSender` (porta).
- `src/infra/email/…`: l'adapter che implementa `EmailSender` con il provider scelto.
- `src/application/prenota.ts`: chiama la funzione pura e poi la porta.

**Ruolo**
Livello domain. Definisce il contenuto della conferma di prenotazione e il contratto per spedirla, senza spedire nulla (ADR-001, ADR-002).

**Dovrebbe**
- Comporre oggetto, destinatario e testo della conferma a partire da dati già pronti (prenotazione, corso, data).
- Dichiarare la porta `EmailSender`, che `infra/` implementa e `application/` usa (ADR-001).
- Ricevere l'orario come parametro, se serve nel testo (ADR-002).

**Non dovrebbe**
- Importare un client SMTP, `fetch` o un SDK del provider (ADR-002).
- Leggere `new Date()` o variabili d'ambiente come il mittente o la URL del sito (ADR-002). Queste arrivano da `application/` o dalla configurazione in `infra/`.
- Lanciare eccezioni per esiti previsti: se l'invio può fallire, il fallimento è un valore di ritorno della porta (ADR-002).
- Decidere *quando* inviare: è compito del caso d'uso (ADR-001).

**Spunto**

```ts
import type { Booking, Course } from './types';

export interface ConfirmationEmail {
  to: string;
  subject: string;
  body: string;
}

export type SendResult =
  | { ok: true }
  | { ok: false; reason: 'provider_unavailable' | 'invalid_address' };

export interface EmailSender {
  send(email: ConfirmationEmail): Promise<SendResult>;
}

export function buildConfirmationEmail(
  booking: Booking,
  course: Course,
): ConfirmationEmail;
```

Il percorso `./types` e i nomi `Booking` e `Course` sono ipotesi: adattali ai tipi che hai già in `domain/`. La funzione è pura e si testa senza mock, cosa che ADR-002 rende possibile.

**Domanda:** l'email va inviata solo dopo il commit della prenotazione, oppure un invio fallito deve annullare la prenotazione? La risposta decide se `prenota` chiama `EmailSender` fuori dalla transazione di ADR-003 o se serve una coda (outbox). In entrambi i casi vale la pena salvarla come ADR-004.
