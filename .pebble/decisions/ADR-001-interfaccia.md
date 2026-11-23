## ADR-001: Interfaccia: Diagnostics e pannello proprio, chat di VS Code come aggiunta
Stato: proposto
Contesto: il bootstrap chiede se usare il chat participant nativo o una webview propria. La chat di VS Code è integrata con l'account GitHub Copilot (da verificare quanto sia vincolante oggi): legarsi solo a quella significa dipendere da un prodotto concorrente per mostrare il proprio.
Decisione: le note di review vanno nelle Diagnostics (sottolineature nell'editor, pannello Problemi). Piano, indicazioni sul nuovo file e test vanno in un pannello laterale proprio. Il chat participant `@pebble` arriva dopo, come canale in più per chi usa già la chat.
Alternative scartate: solo chat participant (dipendenza da Copilot, nessuna presenza nell'editor); solo Diagnostics (non adatte a piani e risposte lunghe).
Conseguenze: un po' più di UI da costruire. In cambio Pebble funziona anche senza Copilot e le note stanno dove si lavora, nell'editor.

Aggiornamento 2026-11-23: il "pannello laterale proprio" è una vista nella barra delle attività (icona Pebble) a forma di conversazione, come nel mockup. Le review compaiono lì e nelle Diagnostics; la spesa resta in un pannello dell'editor.
