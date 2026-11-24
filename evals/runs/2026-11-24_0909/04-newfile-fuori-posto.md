**Il file così com'è non ha posto in `domain/`.** "Inviare un'email" è I/O, e ADR-002 lo esclude dal dominio. Ti propongo di dividerlo in tre parti:

- in `domain/` restano il **contenuto** del messaggio (una funzione pura) e la **porta**, cioè l'interfaccia che descrive l'invio;
- l'invio vero va in `infra/email/`;
- la decisione di *quando* inviare va nel caso d'uso `application/prenota`.

Rinomina il file in `src/domain/confirmationMessage.ts`.

**Ruolo**
Livello domain. Definisce cosa contiene una conferma di prenotazione e il contratto che un adapter di invio deve rispettare (ADR-001, ADR-002).

**Dovrebbe**
- Costruire il messaggio di conferma (destinatario, oggetto, testo) a partire dai dati della prenotazione.
- Dichiarare l'interfaccia `ConfirmationSender`, che `infra/` implementa e `application/` usa. È lo stesso schema che ADR-003 adotta per le transazioni.
- Esprimere gli esiti dell'invio come valori di ritorno, non come eccezioni (ADR-002).

**Non dovrebbe**
- Importare client SMTP, `fetch` o SDK di provider email (ADR-002).
- Leggere l'orologio o la configurazione: data del corso e mittente arrivano come parametri (ADR-002).
- Decidere *quando* inviare, per esempio solo se la prenotazione è riuscita. Quello è orchestrazione e spetta al caso d'uso in `application/` (ADR-001).
- Contenere template HTML legati al provider. Se servono, stanno nell'adapter (`buona pratica`: il dominio resta indipendente dal formato di trasporto).

**Spunto**

```ts
export interface BookingSummary {
  memberName: string;
  memberEmail: string;
  courseName: string;
  startsAt: Date;
}

export interface ConfirmationMessage {
  to: string;
  subject: string;
  body: string;
}

export type SendResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_address' | 'provider_unavailable' };

export interface ConfirmationSender {
  send(message: ConfirmationMessage): Promise<SendResult>;
}

export function buildConfirmationMessage(booking: BookingSummary): ConfirmationMessage;
```

Poi l'adapter va in `src/infra/email/smtpConfirmationSender.ts` e implementa `ConfirmationSender`. `prenota` lo riceve per iniezione, cioè come parametro, invece di importarlo direttamente.

**Domanda prima di scrivere `prenota`:** se l'invio dell'email fallisce, la prenotazione deve restare valida? In altre parole, l'invio avviene dopo il commit della transazione o dentro la transazione? La risposta cambia la firma del caso d'uso e merita un ADR.
