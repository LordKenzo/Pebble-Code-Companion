# `src/domain/sendConfirmationEmail.ts`

**Questo file così non ha posto in `domain/`.** "Inviare un'email" è I/O, e ADR-002 vieta a `domain/` librerie di I/O. L'architettura mette già l'email in `infra/`. Ti propongo di dividerlo in tre pezzi, ognuno nel suo livello (ADR-001).

**Ruolo**
- `domain/`: costruisce il *contenuto* della conferma, cioè una funzione pura dati → messaggio. Definisce anche la porta (l'interfaccia) per spedirlo.
- `infra/`: l'adapter che spedisce davvero il messaggio.
- `application/`: il caso d'uso "prenota" chiama la porta dopo aver salvato la prenotazione.

Rinomina quindi questo file in `src/domain/confirmationEmail.ts`, dato che non "invia" più nulla.

**Dovrebbe**
- Trasformare una prenotazione in un `EmailMessage` (destinatario, oggetto, testo). È pura e testabile senza mock (ADR-002).
- Dichiarare l'interfaccia `ConfirmationMailer`, che `infra/` implementa. È lo stesso schema delle transazioni in ADR-003.
- Ricevere già pronti i dati che dipendono dal tempo, come la data formattata o l'ora del corso.

**Non dovrebbe**
- Importare client SMTP, `fetch` o SDK di provider (ADR-002).
- Leggere `new Date()` o variabili d'ambiente come il mittente: le passa `application/` (ADR-002).
- Chiamare il mailer. L'orchestrazione spetta al caso d'uso (ADR-001).
- Lanciare eccezioni per esiti previsti (ADR-002).

**Punto di partenza**

```ts
// src/domain/confirmationEmail.ts
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface ConfirmationData {
  memberEmail: string;
  memberName: string;
  courseName: string;
  startsAt: string; // già formattata da application
}

export function buildConfirmationEmail(data: ConfirmationData): EmailMessage;

export interface ConfirmationMailer {
  send(message: EmailMessage): Promise<void>;
}
```

Gli altri due file:
- `src/infra/email/smtpConfirmationMailer.ts` implementa `ConfirmationMailer`.
- `src/application/prenota.ts` riceve un `ConfirmationMailer` come dipendenza.

Il tipo di `ConfirmationData` va adattato ai tipi `Booking`/`Course` che hai già in `domain/` (`best practice`).

**Domanda:** se l'invio dell'email fallisce, la prenotazione resta valida? Se sì, il caso d'uso invia *dopo* il commit e registra l'errore. Se no, serve un esito previsto in più e la cosa tocca la transazione di ADR-003. In entrambi i casi vale la pena scriverlo in un ADR.
