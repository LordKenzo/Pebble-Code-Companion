# Architettura di Pebble

> Generato in MODE: INIT dal bootstrap del 2026-11-23, aggiornato la sera stessa per il percorso (ADR-006…009). Stato: proposto.

## Lettura del bootstrap
Un'estensione VS Code che fa da pair engineer. Guida lungo un percorso di compiti, prepara firme e pseudocodice, e aiuta su richiesta senza mai scrivere la logica (ADR-003, ADR-006).
Il valore sta in due cose: la qualità dei consigli e il fatto che siano ancorati alle decisioni del progetto.
Quindi il prompt è il prodotto; l'estensione è il modo di consegnarlo al momento giusto.

## Livelli

```
vscode adapter ─┐
llm adapter ────┼──▶ core (puro)
store adapter ──┘
```

- **core**: logica pura, nessun import da `vscode` né chiamate di rete. Costruisce il contesto, sceglie la modalità, applica il filtro sulle zone, interpreta le risposte, legge e aggiorna il percorso, decide quali compiti sono fatti dati i segnali. Si testa senza editor e senza API.
- **adapters**: tutto ciò che parla con l'esterno. Implementano interfacce definite nel core.
  - `vscode`: comandi, eventi su file, Diagnostics, pannello
  - `llm`: provider del modello (ADR-005)
  - `store`: lettura e scrittura di `.pebble/`, compresi percorso e quaderno (ADR-002, ADR-007)
  - `signals`: errori dell'editor e test in TAP (ADR-008)

Regola: le dipendenze puntano sempre verso `core`. Il core non sa che esiste VS Code.

## Struttura delle cartelle

```
src/
  core/
    context/      raccoglie bootstrap, ADR, file e diff in un contesto per il modello
    modes/        una definizione per modalità: INIT, PLAN_STEP, SCAFFOLD, HELP, REVIEW, TESTS, NEXT, CHAT
    policy/       filtro sulle tre zone e limiti sulle risposte (ADR-003)
    path/         percorso: parsing di percorso.md, evaluate(compiti, segnali) (ADR-007, ADR-008)
    scaffold/     compone lo scheletro del file da dati strutturati (ADR-003)
    notebook/     quaderno dei concetti (ADR-007)
    model/        tipi: Nota, Gravità, Ancora, Decisione, Compito, Concetto
  adapters/
    vscode/       estensione, comandi, Diagnostics, vista Percorso e Quaderno, fumetto (ADR-009), conversazione
    llm/          provider Claude, OpenAI e locali (ADR-005)
    store/        file in .pebble/
    signals/      errori dell'editor e comando di test con output TAP (ADR-008)
prompts/          prompt di sistema e versioni
evals/            casi di valutazione del prompt
```
