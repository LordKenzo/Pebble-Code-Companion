**Lettura del bootstrap.** DogRun è un'app stile Strava per chi corre con il cane: registrare le uscite, vederle su una mappa, magari confrontarle o condividerle. Il bootstrap però non dice ancora come nasce una corsa, e da questo dipendono stack, architettura e roadmap. Prima di proporre decisioni mi serve questa risposta.

**Domanda:** durante la corsa, chi registra il percorso?

- **A · L'app sul telefono.** Avvii la corsa, il GPS traccia in tasca anche a schermo spento. Serve un'app mobile (ad esempio React Native/Expo) con permessi di localizzazione in background e gestione della batteria. È la strada più impegnativa.
- **B · Un altro dispositivo**, come un orologio Garmin o un collare GPS. L'utente carica il file della corsa (GPX/FIT) e DogRun lo analizza e lo mostra. Basta una web app, e il primo passo è molto più leggero.

Se non hai ancora un'idea precisa, ti consiglio di partire da **B** e aggiungere A in un secondo momento. La logica di dominio (distanza, passo, pause del cane) si scrive e si testa sui file GPX senza dover uscire a correre. Quando arriverà la registrazione dal telefono, quella logica resterà la stessa.

Dimmi A, B o entrambe, e aggiungi il linguaggio che conosci meglio se ne hai uno. Con la tua risposta preparo ADR, architettura, roadmap e il primo file da cui partire.
