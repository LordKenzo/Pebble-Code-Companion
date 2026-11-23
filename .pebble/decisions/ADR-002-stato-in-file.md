## ADR-002: Lo stato del progetto vive in .pebble/, in Markdown versionabile
Stato: proposto
Contesto: le review devono basarsi sulle decisioni del progetto, e queste decisioni devono essere leggibili, modificabili e condivisibili col team.
Decisione: `.pebble/architecture.md`, `.pebble/roadmap.md` e `.pebble/decisions/ADR-*.md` sono file Markdown nel repository. Pebble li legge a ogni richiesta; l'utente può modificarli a mano e Pebble li rispetta. Lo stato effimero (cache, feedback) va in una cartella ignorata da git.
Alternative scartate: database locale o stato nell'estensione (invisibile, non versionato, non condivisibile).
Conseguenze: le decisioni passano dalle code review del team come il codice. Bisogna gestire file modificati a mano in modo imprevisto (parsing tollerante).
