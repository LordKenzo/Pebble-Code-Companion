**Lettura del bootstrap.** Vuoi costruire un'app per chi corre con il cane: registrare le uscite (percorso, distanza, tempo) e probabilmente vederle e condividerle, come fa Strava. Il bootstrap però non dice ancora vincoli, stack, né cosa resta in dubbio. Per questo mi fermo qui prima di proporre decisioni (`bootstrap`).

Un dato manca e cambia tutto il resto: **dove gira l'app**. Le tre strade portano a progetti molto diversi:

- **App mobile** che registra il GPS durante la corsa: serve una tecnologia mobile, i permessi di localizzazione e il tracciamento in background.
- **Web app** che importa tracce già registrate (GPX da orologio o telefono): basta un browser, ma niente registrazione dal vivo.
- **Entrambe**: la complessità raddoppia.

Domanda: **l'app deve registrare la corsa dal vivo con il GPS del telefono, oppure in questa prima versione basta caricare e mostrare tracce già registrate altrove?** Se hai già in mente un linguaggio o un framework, aggiungilo nella risposta.
