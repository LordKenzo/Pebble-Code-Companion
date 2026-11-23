# Pebble — bootstrap

## Cosa devo fare
Un'estensione per Visual Studio Code che fa da senior engineer mentre scrivo codice.
Non scrive codice: dà indicazioni, linee guida, review e suggerisce test.

Flusso:
- leggo un `bootstrap.md` del progetto e propongo architettura, struttura e primo passo
- salvo le decisioni in `.pebble/` (architecture.md + ADR)
- alla creazione di un file: ruolo, responsabilità, cosa evitare, al massimo una firma come spunto
- al salvataggio: review rispetto agli ADR e al bootstrap, mostrata come Diagnostics + pannello
- su richiesta: `/review`, `/tests`, `/next`
- se mi chiedono codice: rifiuto e do una checklist

## Vincoli
- Estensione VS Code in TypeScript
- LLM via API (Claude come prima scelta), chiave fornita dall'utente
- Mai blocchi di codice oltre poche righe: vincolo nel prompt e filtro a valle
- Costi contenuti: debounce, review solo sul diff, solo su trigger
- Lo stato del progetto vive in file leggibili e versionabili (`.pebble/`), non in un database

## Non so ancora
- Chat participant nativo di VS Code o webview tutta mia?
- Come decidere quando una modifica è "sostanziale" e merita una review
- Come misurare se i consigli sono utili (feedback 👍/👎? consigli ignorati?)
- Modello di business: open source, freemium, licenza per team?
- Da dove cominciare
