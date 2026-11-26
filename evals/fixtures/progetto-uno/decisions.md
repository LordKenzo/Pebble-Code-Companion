## ADR-001: TypeScript e Node.js, app web locale
Stato: proposto
Decisione: TypeScript su Node.js. Un piccolo server Express sul Mac, la schermata è una pagina HTML semplice aperta su localhost, senza framework.

## ADR-002: Database SQLite in un solo file
Stato: proposto
Decisione: SQLite in un file dentro data/, letto con better-sqlite3. Tabelle: clienti, contatti (cliente, prodotto, data, note), tag collegati al cliente.

## ADR-003: Tre strati: dominio, storage, web
Stato: proposto
Decisione: src/domain (tipi e regole), src/storage (SQLite), src/web (Express). Il dominio non importa niente dagli altri due.

## ADR-004: Vitest come test runner
Stato: proposto
Decisione: Vitest, test nella cartella tests/, prima di tutto per le regole del dominio.

## ADR-005: Errori come risultati chiari
Stato: proposto
Decisione: validazione nel dominio prima di salvare; errori previsti invece di eccezioni; una ricerca senza risultati restituisce una lista vuota; nomi ripuliti, tag in minuscolo.
