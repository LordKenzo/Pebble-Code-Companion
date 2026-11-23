## ADR-008: I compiti si spuntano con segnali locali: errori dell'editor e test in TAP
Stato: proposto
Contesto: un compito deve chiudersi quando test e compilatore lo confermano, senza chiamare il modello e senza legarsi a un solo linguaggio.
Decisione:
- **Errori di compilazione**: letti da VS Code con `vscode.languages.getDiagnostics()`. Sono già calcolati dal language server.
- **Test**: Pebble lancia un comando configurabile (`pebble.testCommand`, default `node --test --test-reporter=tap`) e legge l'output TAP. Ogni test si collega al compito in base al nome indicato in `fatto quando:`.
- **Quando**: al salvataggio, con un ritardo di circa 1 secondo, e con il comando "Verifica il percorso".
`core/path` contiene una funzione pura `evaluate(compiti, segnali)`: un test che torna rosso riapre il compito.
Alternative scartate: leggere i risultati dall'API Testing di VS Code (per i test lanciati da altre estensioni è ancora sperimentale); lanciare `tsc` a ogni salvataggio (lento, e l'editor ha già gli errori); chiedere al modello se il compito è fatto (costa e non è affidabile).
Conseguenze: funziona con qualsiasi runner che produca TAP (node:test, Vitest, Jest e pytest con un plugin). I test lanciati al salvataggio devono essere veloci: se il comando supera un tempo limite, Pebble lo dice e passa alla verifica manuale.
