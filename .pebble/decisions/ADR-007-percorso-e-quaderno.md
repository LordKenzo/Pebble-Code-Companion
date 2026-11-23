## ADR-007: Percorso e quaderno sono checklist Markdown in .pebble/
Stato: proposto
Contesto: il passo della roadmap diventa una lista di compiti con una condizione di completamento, e i concetti incontrati vanno raccolti in un quaderno. Serve uno stato che Pebble legge e scrive, coerente con ADR-002.
Decisione: due file Markdown.
- `.pebble/percorso.md`: una sezione per passo della roadmap e un compito per riga, nel formato GitHub `- [ ]` / `- [x]`. Sotto ogni compito, righe rientrate con chiavi fisse: `fare:`, `firma:`, `fatto quando:`. La condizione usa una sintassi semplice: `test "20 kg" "60 kg"`, `file src/core/plates.ts esporta platesFor`, `nessun errore in src/core/plates.ts`, `a mano`.
- `.pebble/quaderno.md`: un concetto per sezione, con stato (nuovo, capito, da approfondire), sintesi e il compito in cui è nato.
Il parsing è tollerante: le righe che non riconosce le conserva e le ignora. Lo stato delle caselle nel file è quello che vale.
Alternative scartate: JSON (proposto nel piano: non si legge e non si modifica bene a mano, e contraddice ADR-002); stato nell'estensione (invisibile e non versionato).
Conseguenze: GitHub mostra il percorso con le caselle di spunta. Le modifiche di Pebble alle caselle compaiono nei diff: vanno fatte in modo minimo, una riga per casella. La sintassi di `fatto quando:` va documentata e testata in `core/path`.
