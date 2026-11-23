## ADR-006: Pebble interviene solo su richiesta
Stato: accettato
Contesto: Pebble vuole essere un pair engineer, non un correttore automatico. Dopo la prova su mini-calc lo sviluppatore ha chiesto una guida "poco invadente, che viene in aiuto quando la si invoca". La review automatica al salvataggio (ADR-004) e l'indicazione su ogni file nuovo andavano nella direzione opposta.
Decisione: ogni chiamata al modello parte da un gesto dello sviluppatore:
- un comando;
- `⌥P` sulla riga;
- un pulsante del percorso ("Prepara il file", "Aiutami su questo compito", "Rivedi il file");
- un messaggio in chat.
L'unica cosa automatica è la verifica locale del percorso (ADR-008): non usa il modello, non costa niente e cambia solo lo stato delle caselle. L'indicazione su un file nuovo diventa un'opzione, disattivata per default.
Alternative scartate: review al salvataggio con soglie (ADR-004: rumore e costo, e interrompe); suggerimenti mentre si scrive (effetto Clippy, e una chiamata al modello per ogni pausa).
Conseguenze: Pebble deve farsi trovare senza farsi sentire, con il percorso sempre visibile nel pannello e `⌥P` documentato. Non c'è più il "momento giusto" automatico: lo decide lo sviluppatore. Il passo 7 della vecchia roadmap (trigger al salvataggio) viene abbandonato.
