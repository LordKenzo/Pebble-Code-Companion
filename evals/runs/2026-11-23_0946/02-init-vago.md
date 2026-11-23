**Lettura del bootstrap.** Vuoi un'app per registrare le corse fatte insieme al proprio cane, sul modello di Strava: tracciamento del percorso, storico delle uscite e probabilmente una parte social. Il bootstrap però contiene solo l'idea. Non ci sono vincoli, piattaforma, stack, perimetro della prima versione né dubbi aperti. Se proponessi adesso degli ADR, sarebbero ipotesi mie e non decisioni tue.

La scelta che condiziona tutte le altre è il dispositivo che registra la corsa, perché da lì dipendono il tracciamento GPS in background, la batteria, il funzionamento offline e quindi lo stack.

**Domanda:** la prima versione deve registrare la corsa dal telefono, con GPS attivo anche a schermo spento, oppure ti basta un'app (anche web) che importa tracce già registrate altrove, come file GPX da Strava o dall'orologio, e ci aggiunge la parte cane?

Quando mi rispondi, aggiungi al bootstrap anche:
- quali linguaggi o framework conosci già, o vuoi imparare;
- se lavori da solo e quanto tempo hai a disposizione;
- le 2-3 funzionalità senza cui la v1 non ha senso, per esempio dati del cane, soste e pause, statistiche o feed social.

Con queste informazioni preparo decisioni, architettura e roadmap.
