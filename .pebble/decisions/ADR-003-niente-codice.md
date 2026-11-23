## ADR-003: Il vincolo "niente codice" si applica su due livelli
Stato: proposto
Contesto: è il principio del prodotto. Un LLM sotto pressione ("è urgente", "solo un esempio") prima o poi cede, quindi non basta il prompt.
Decisione: (1) regola esplicita nel prompt di sistema; (2) filtro in `core/policy` sulla risposta: un blocco di codice oltre 3 righe viene rimosso e sostituito da un avviso, e la risposta viene registrata come violazione. Le violazioni sono casi di eval da aggiungere.
Alternative scartate: solo prompt (si rompe); vietare ogni blocco di codice (perde firme e riferimenti puntuali, che sono utili).
Conseguenze: il filtro deve riconoscere anche codice non racchiuso in blocchi. Serve una suite di test dedicata.
