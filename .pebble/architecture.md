# Architettura di Pebble

> Generato in MODE: INIT dal bootstrap del 2026-11-23. Stato: proposto.

## Lettura del bootstrap
Un'estensione VS Code che dà indicazioni e fa review usando un LLM, senza mai produrre codice.
Il valore sta in due cose: la qualità dei consigli e il fatto che siano ancorati alle decisioni del progetto.
Quindi il prompt è il prodotto; l'estensione è il modo di consegnarlo al momento giusto.

## Livelli

```
vscode adapter ─┐
llm adapter ────┼──▶ core (puro)
store adapter ──┘
```

- **core**: logica pura, nessun import da `vscode` né chiamate di rete. Costruisce il contesto, sceglie la modalità, applica il filtro "niente codice", interpreta le risposte, decide se una modifica merita una review. Si testa senza editor e senza API.
- **adapters**: tutto ciò che parla con l'esterno. Implementano interfacce definite nel core.
  - `vscode`: comandi, eventi su file, Diagnostics, pannello
  - `llm`: provider del modello (ADR-005)
  - `store`: lettura e scrittura di `.pebble/` (ADR-002)

Regola: le dipendenze puntano sempre verso `core`. Il core non sa che esiste VS Code.

## Struttura delle cartelle

```
src/
  core/
    context/      raccoglie bootstrap, ADR, file e diff in un contesto per il modello
    modes/        una definizione per modalità: INIT, NEW_FILE, REVIEW, TESTS, NEXT, CHAT
    policy/       filtro "niente codice" e limiti sulle risposte (ADR-003)
    triggers/     euristica "modifica sostanziale" (ADR-004)
    model/        tipi: Nota, Gravità, Ancora, Decisione
  adapters/
    vscode/       estensione, comandi, Diagnostics, pannello
    llm/          provider Claude
    store/        file in .pebble/
prompts/          prompt di sistema e versioni
evals/            casi di valutazione del prompt
```
