# `src/domain/sendConfirmationEmail.ts`

**Questo file non va in `domain/` così com'è.** "Inviare" un'email è I/O, e ADR-002 lo esclude dal dominio. Ti propongo di dividerlo in tre parti, ognuna nel suo livello (ADR-001):

- **domain**: cosa dice l'email (puro) e l'interfaccia per inviarla (porta).
- **application**: il caso d'uso `prenota` chiama la porta dopo aver salvato la prenotazione.
- **infra**: l'adapter che parla davvero con il provider (`infra/email/`).

È lo stesso schema che ADR-003 usa per le transazioni: l'interfaccia sta in domain, l'implementazione in infra.

**Ruolo**
Nel dominio restano due cose:
- il modello del messaggio di conferma;
- il contratto per spedirlo.

Ti suggerisco di rinominare il file in `src/domain/confirmationEmail.ts`, perché il nome attuale descrive un'azione di I/O.

**Deve**
- Costruire destinatario, oggetto e testo partendo da una prenotazione: dati in ingresso, valore in uscita (ADR-002).
- Dichiarare la porta `EmailSender`, che `application/` riceve dall'esterno.
- Restare testabile senza mock: chiami la funzione e controlli i campi restituiti.

**Non deve**
- Importare client SMTP, SDK del provider, `fetch` o `fs` (ADR-002).
- Leggere l'orologio di sistema per scrivere data o ora nel testo. Le riceve già pronte nella prenotazione (ADR-002).
- Decidere *quando* inviare l'email: quell'orchestrazione spetta a `application/prenota` (ADR-001).
- Contenere template HTML legati al provider. Quelli appartengono all'adapter in `infra/email` (`best practice`).

**Punto di partenza**

```ts
// src/domain/confirmationEmail.ts
export interface ConfirmationEmail {
  to: string;
  subject: string;
  body: string;
}

// Booking: il tipo prenotazione già presente nel tuo dominio
export declare function buildConfirmationEmail(booking: Booking): ConfirmationEmail;

export interface EmailSender {
  send(email: ConfirmationEmail): Promise<void>;
}
```

Poi:
- `infra/email/smtpEmailSender.ts` (o il nome del tuo provider) implementa `EmailSender`;
- il caso d'uso `prenota` riceve un `EmailSender` come dipendenza e lo chiama.

**Perché conta**
Un'email che non parte non deve annullare una prenotazione già salvata. Se tieni l'invio fuori dal dominio, puoi decidere in `application/` come gestire il fallimento: loggarlo, ritentare, metterlo in coda. Il dominio intanto resta puro.

**Domanda:** se l'invio fallisce, la prenotazione deve restare valida? La risposta decide se l'invio va dentro o fuori dalla transazione dell'adapter, e forse merita un ADR.
