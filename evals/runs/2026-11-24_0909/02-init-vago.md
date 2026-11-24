**Lettura del bootstrap**
Vuoi un'app per registrare le corse con il cane, come Strava: tracciamento del percorso via GPS, storico delle uscite e probabilmente statistiche (distanza, tempo, ritmo). Il bootstrap non dice ancora su quale piattaforma gira né quali tecnologie conosci, e da questo dipendono tutte le decisioni successive.

**Una domanda prima di decidere**

Dove deve girare DogRun e con cosa ti trovi a tuo agio? Le opzioni principali sono tre:

- **App mobile installabile**, per esempio React Native con Expo.
- **Web app usabile dal telefono**, cioè una PWA.
- **Solo un prototipo** che importa tracce GPX già registrate.

La differenza conta perché un'app "tipo Strava" deve leggere il GPS anche a schermo spento e in tasca. Su web questo è molto limitato, quindi la scelta cambia lo stack, l'architettura e il primo passo della roadmap.

Se mi dici anche che linguaggio usi di solito, per esempio TypeScript, ti propongo subito ADR, architettura e roadmap su misura.
