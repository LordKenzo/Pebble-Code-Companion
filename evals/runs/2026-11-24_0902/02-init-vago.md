**Lettura del bootstrap**

DogRun è un'app simile a Strava pensata per chi corre con il cane: registra le uscite e le mostra (percorso, distanza, tempi), probabilmente con informazioni sul cane. Mancano però vincoli, piattaforma, stack, dubbi e funzionalità del primo rilascio. Con così poco, qualunque decisione su architettura e strumenti sarebbe tirata a indovinare (`bootstrap › vuoto`).

Prima di proporre gli ADR mi serve una risposta, perché da questa dipende quasi tutto il resto:

**La corsa va registrata dal telefono in tempo reale, con il GPS attivo mentre corri, oppure all'inizio ti basta inserire o importare corse già fatte (per esempio file GPX da un orologio) e vederle su mappa e statistiche?**

Nel primo caso serve un'app mobile, con permessi di localizzazione in background, gestione della batteria e salvataggio offline. Nel secondo basta una web app, molto più semplice da avviare e da testare. Puoi aggiungere anche il linguaggio che conosci meglio. Appena rispondi preparo decisioni, architettura e roadmap.
