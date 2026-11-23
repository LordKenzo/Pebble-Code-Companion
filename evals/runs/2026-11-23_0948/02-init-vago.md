**Lettura del bootstrap.** Vuoi un'app che registri le corse con il cane, come Strava: tracciamento GPS del percorso, distanza, tempo, probabilmente uno storico e forse una parte social. Per ora il bootstrap ha solo l'idea. Mancano vincoli, piattaforma e stack, e da questi dipendono quasi tutte le decisioni.

Il punto più delicato è il tracciamento GPS mentre lo schermo è spento. Si scrive in modo molto diverso a seconda di dove gira l'app:

- **App nativa:** ha pieno accesso al GPS in background.
- **Framework cross-platform** (Flutter, React Native): l'accesso c'è, ma passa da plugin.
- **Web app o PWA:** il tracciamento in background è molto limitato.

Prima di proporti ADR, architettura e roadmap, mi serve una risposta.

**Domanda:** per la prima versione, su quale telefono deve girare (iOS, Android o entrambi) e con quale linguaggio o framework sei già a tuo agio?
