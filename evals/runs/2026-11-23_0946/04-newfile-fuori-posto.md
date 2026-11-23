**Questo file, così com'è, non ha posto in `domain/`.** Inviare un'email è I/O, e `ADR-002` lo esclude esplicitamente dal dominio. Il nome `sendConfirmationEmail` descrive un'azione, non una regola. Ci sono tre direzioni possibili, a seconda di cosa ti serve davvero.

**Ruolo (riposizionato)**
- **`domain/`**: qui può stare solo il **contratto** (una porta) e, se vuoi, la costruzione **pura** del contenuto della conferma, cioè quali dati contiene e per quale prenotazione.
- **`application/`**: il caso d'uso `prenota` decide *quando* notificare, dopo l'esito positivo.
- **`infra/`**: l'adapter email esegue l'invio vero e proprio.

**Dovrebbe** (la parte che resta in domain)
- Definire un'interfaccia per la notifica di conferma, che `application/` riceve per iniezione (`ADR-001`, dipendenze verso domain).
- Eventualmente esporre una funzione pura che, data una prenotazione confermata, restituisce i dati del messaggio (destinatario, corso, data). È facile da testare senza mock.
- Usare i tipi del dominio (prenotazione, corso), non tipi di librerie esterne.

**Non dovrebbe**
- Importare client SMTP, `fetch` o SDK di provider email (`ADR-002`).
- Leggere l'orologio per scrivere "prenotato il…" nel testo. La data va passata come input (`ADR-002`).
- Lanciare eccezioni per un invio fallito. Il fallimento dell'invio riguarda l'adapter e il caso d'uso, non il dominio (`ADR-002`, esiti come valori).
- Contenere template HTML o formattazione da provider. Quella è presentazione e va in `infra/`.

**Spunto**
```ts
interface ConfirmationNotifier { notifyBookingConfirmed(booking: ConfirmedBooking): Promise<NotifyResult> }
```
Conviene rinominare il file in base al contratto, ad esempio `domain/ports/confirmationNotifier.ts`. L'invio vero andrà in qualcosa come `infra/email/`.

**Domanda:** se l'email non parte, la prenotazione deve restare valida? Se la risposta è sì, conviene inviare dopo il commit della transazione (`ADR-003`). Questo cambia dove la chiami in `prenota`.
