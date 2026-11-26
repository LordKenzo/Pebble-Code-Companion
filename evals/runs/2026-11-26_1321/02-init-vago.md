**Lettura del bootstrap**

Vuoi un'app per registrare e condividere le corse fatte con il cane, sul modello di Strava: percorsi, distanze, tempi, probabilmente un profilo per il cane e una parte social. Il bootstrap però non dice ancora su che piattaforma gira, con che stack, né quali vincoli hai (tempo, budget, se lavori da solo). Senza questo non posso proporre decisioni sensate: cambierebbero tutte.

Mi fermo qui con una sola domanda, quella che sposta di più il lavoro:

**La corsa deve essere registrata dall'app stessa, con il GPS del telefono mentre corri (quindi un'app mobile che traccia in background), oppure ti basta un'app web dove carichi corse registrate altrove (per esempio un file GPX da smartwatch) e le vedi su mappa con le statistiche?**

Te lo chiedo perché la differenza è enorme:

- Il **tracciamento GPS in tempo reale** richiede un'app mobile, con permessi di posizione in background, gestione della batteria e salvataggio offline. Lo stack sarebbe probabilmente React Native/Expo o nativo.
- Il **caricamento di file** si può fare con una web app. È molto più semplice da costruire e da testare, e il primo passo si chiude in una sessione.

Quando mi rispondi, se puoi aggiungi al bootstrap anche:

- il linguaggio o lo stack che conosci meglio;
- se lavori da solo;
- cosa c'è di specifico per il cane rispetto a Strava (pause per i bisogni, più cani per corsa, stato di salute, temperatura…).

Con queste informazioni ti preparo le ADR, l'architettura e la roadmap.
