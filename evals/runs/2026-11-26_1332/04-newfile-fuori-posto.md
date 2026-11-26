**Questo file non sta bene in `domain/`.** Il nome dice "invia", e inviare un'email è I/O: per ADR-002 il dominio non fa I/O, riceve dati e restituisce risultati. Il lavoro va diviso su tre livelli (ADR-001):

- `domain/`: **cosa** dire. Una funzione pura che costruisce il messaggio, più l'interfaccia (porta) per spedirlo.
- `infra/email/`: **come** spedirlo. L'adapter che implementa la porta.
- `application/prenota.ts`: **quando** spedirlo. Il caso d'uso chiama la porta dopo una prenotazione riuscita.

Ti propongo di rinominare il file in `src/domain/confirmationEmail.ts`.

**Ruolo**
Livello domain. Definisce il contenuto dell'email di conferma e il contratto che un adapter deve rispettare per spedirla.

**Deve**
- Costruire il messaggio (destinatario, oggetto, corpo) a partire da una prenotazione già confermata.
- Dichiarare la porta `EmailSender`. È lo stesso schema che ADR-003 usa per le transazioni: interfaccia in domain, implementazione in infra.
- Restare deterministico: stessi dati in ingresso, stesso messaggio in uscita, quindi testabile senza mock.

**Non deve**
- Importare client SMTP, `fetch` o SDK di provider (ADR-002).
- Leggere l'orologio per scrivere "prenotato il…": la data arriva come dato (ADR-002).
- Decidere se spedire. Quella è orchestrazione e appartiene al caso d'uso in `application/` (ADR-001).
- Lanciare eccezioni per esiti previsti. Se costruire il messaggio può fallire per un motivo noto, restituisci un valore (ADR-002).

**Punto di partenza**

```ts
// src/domain/confirmationEmail.ts
import type { Prenotazione } from './prenotazione';

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

export declare function buildConfirmationEmail(p: Prenotazione): EmailMessage;

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
```

L'adapter vivrà in `src/infra/email/` e implementerà `EmailSender`. In alternativa la porta può stare in `domain/ports.ts`, se preferisci raccogliere tutte le interfacce verso l'esterno in un posto solo.

Un fallimento dell'invio deve annullare la prenotazione, oppure la prenotazione resta valida e l'email si ritenta più tardi?
