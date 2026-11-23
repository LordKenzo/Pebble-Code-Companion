## ADR-005: Provider del modello dietro un'interfaccia, Claude come prima implementazione
Stato: accettato (aggiornato il 2026-11-23)
Contesto: il bootstrap indica Claude come prima scelta e la chiave fornita dall'utente. Modelli e prezzi cambiano in fretta.
Decisione: il core definisce un'interfaccia minima (invia contesto e modalità, ricevi la risposta). L'adapter Claude è il primo. La chiave sta nel SecretStorage di VS Code, mai in file o impostazioni. Il contesto stabile (prompt di sistema, ADR, architettura) va messo in testa alla richiesta per sfruttare il prompt caching.
Alternative scartate: chiamate dirette al provider sparse nel codice (impossibile cambiare modello); proxy proprio (costi e gestione dei dati degli utenti, prematuro).
Conseguenze: gli eval devono girare sullo stesso adapter, così si confrontano i modelli. Il codice dell'utente parte verso il provider: va detto chiaramente nella documentazione.

Aggiornamento 2026-11-23: oltre a Claude, l'estensione supporta OpenAI e i modelli locali (Ollama, LM Studio, llama.cpp) tramite un unico adapter compatibile OpenAI con indirizzo configurabile. Prima prova: `qwen3-coder:30b` in locale trova le violazioni evidenti (caso 05) ma non la race condition (caso 07). Il locale va bene per privacy e costi zero, Claude per le note "da senior".
