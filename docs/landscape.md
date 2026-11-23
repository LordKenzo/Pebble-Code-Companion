# Panorama: cosa esiste già

Sintesi delle analisi fatte con Claude e Gemini (novembre 2026). Il mercato cambia in fretta: da riverificare prima di decisioni importanti.

## Strumenti vicini all'idea

| Strumento | Cosa fa | Cosa manca rispetto a Pebble |
|---|---|---|
| Kiro (AWS), GitHub Spec Kit | Sviluppo spec-driven: requisiti → design → task | Poi il codice lo scrive l'AI |
| Roo Code, Cline (custom modes) | Modalità "Architect"/"Reviewer" senza permessi di scrittura, regole in `.clinerules` | Va configurato a mano; nessun flusso legato al ciclo di vita del file |
| Cursor rules, Copilot instructions, `CLAUDE.md` | Linee guida di progetto | Pensate per guidare l'AI che scrive, non lo sviluppatore |
| Claude Code, output style "Learning" | Lascia `TODO(human)` da scrivere a te | Terminale e sessione singola, nessuna memoria del progetto |
| CodeRabbit (anche estensione VS Code), Sourcery, Copilot review | Review su modifiche locali o PR | Regole generiche, non legate alle decisioni del progetto |
| Qodo (ex CodiumAI) | Analisi del comportamento, edge case, test | Spinge verso la generazione dei test |

## Cosa distingue Pebble

1. **Rifiuto di scrivere codice per scelta.** È il prodotto, non una configurazione.
2. **Memoria di progetto.** `bootstrap.md` → `.pebble/` (architettura + ADR), usata in ogni review.
3. **Ciclo di vita del file.** Interviene alla creazione e al salvataggio, non solo sulla PR.

## Perché può servire

- **Debito cognitivo da AI**: generare 500 righe è facile, mantenerle senza averne capito il design no.
- **Deriva architetturale**: al decimo file si inizia a sporcare l'impianto; serve qualcuno che confronti ogni file con le decisioni iniziali.
- **TDD leggero**: suggerire i casi di test mentre scrivi, non a fine giornata.

## Utenti target

- Sviluppatori che vogliono restare padroni del proprio codice
- Junior e studenti (mentore, non scorciatoia)
- Team che vogliono coerenza architetturale

## Rischio principale

L'effetto Clippy. Se i consigli sono troppi o generici, viene disattivato in due giorni.
Contromisure: trigger precisi, pannello discreto, severità regolabile, consigli sempre ancorati al progetto.
