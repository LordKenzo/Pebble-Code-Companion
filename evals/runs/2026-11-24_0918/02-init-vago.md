**Lettura del bootstrap**

Vuoi un'app per chi corre con il cane: registrare le uscite, vedere distanza e tempi, e forse confrontarsi con altri, come fa Strava. Il bootstrap però non dice dove gira l'app né come nasce una corsa. Questa scelta decide quasi tutto il resto: linguaggio, librerie, architettura, primo passo. Per questo mi fermo qui prima di proporre ADR.

**Domanda**

La prima versione deve **registrare la corsa dal telefono con il GPS mentre corri**? In quel caso serve un'app mobile, con permessi di posizione e funzionamento in background. Oppure basta un'app **web** dove inserisci o carichi le corse dopo, per esempio un file GPX esportato da un altro tracker?

Se hai già una preferenza di linguaggio o framework, aggiungila nella risposta. Con queste informazioni preparo decisioni, architettura e roadmap.
