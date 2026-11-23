# Piano: Pebble come pair engineer su richiesta

> Proposta del 2026-11-23, dopo la prova su mini-calc e il mockup `mockup/on-demand.html`. Approvata: le decisioni sono in `.pebble/decisions/` (ADR-003, ADR-006…009) e i passi in `.pebble/roadmap.md`, fase 2.

## Cosa vogliamo

Un pair engineer che ti forma mentre lavori, senza scrivere la logica al posto tuo e senza interromperti:

1. **Percorso**: il passo della roadmap diventa una checklist di compiti piccoli, ognuno con cosa fare, la firma e quando si considera fatto.
2. **Spunta automatica**: un compito si chiude quando test e compilatore lo confermano. Non serve un modello: è una verifica locale e gratuita.
3. **Prepara il file**: import, tipi, firma e il pseudocodice come commento dentro la funzione, più una domanda su cui ragionare.
4. **Fumetto con ⌥P**: sotto la riga, parte da una domanda e sale la scala di aiuto. Offre "Perché conta?" e "Approfondisci".
5. **Quaderno**: i concetti incontrati, segnati come nuovi, capiti o da approfondire.

La chat resta, ma diventa secondaria. Niente interventi automatici del modello.

## Cosa si riusa della v0.6

Circa due terzi delle 2.440 righe dell'estensione restano utili.

| Parte | File | Uso nella nuova versione |
|---|---|---|
| Provider dei modelli | `adapters/llm/*`, `core/ports.ts` | Invariati. `generate` con schema zod serve a percorso, scheletro e fumetto |
| Contesto di progetto | `core/context.ts`, `adapters/store/workspaceStore.ts` | Invariati, più la lettura del percorso e del quaderno |
| Filtro sulle zone | `core/policy.ts` | Invariato. Resta la seconda difesa per fumetto e chat |
| Costi e budget | `core/cost.ts`, `adapters/vscode/spendLedger.ts` | Invariati |
| Livello di esperienza | `LEVEL_HINTS` in `core/context.ts` | Da allineare a v0.4: oggi dice ancora "senza codice" anche per i comandi |
| INIT da bootstrap | `core/modes.ts` (InitPlan) | Invariato. In più, ogni passo della roadmap potrà generare i suoi compiti |
| Prompt | `prompts/mentor.md` v0.4 | Tre zone, scala di aiuto e buone pratiche restano. Si aggiungono tre modalità |
| Orchestrazione | `mentorSession.ts` (`run`, `account`, gestione errori) | Da estrarre in un servizio comune, usato da chat, fumetto e scheletro |
| Review del file | `core/reviewFile.ts`, `diagnostics.ts` | Resta come comando manuale e come compito "Rileggi con Pebble" |
| Chat e impostazioni | `chatView.ts`, `settingsPanel.ts` | Restano. La chat passa in secondo piano |
| Eval | `evals/run.py`, casi 01–14 | Invariati, più i casi delle modalità nuove |

Da togliere o spegnere:
- l'indicazione automatica su ogni file nuovo (`onDidCreateFiles`), che diventa un'opzione disattivata;
- ADR-004 (review automatica sulle modifiche sostanziali), che non è mai stato implementato al salvataggio e va superato.

## Cosa è nuovo

### 1. Modello del percorso (`core/path.ts`, puro)
- `Task`: id, titolo, passo della roadmap, cosa fare, firma (facoltativa), condizione di completamento.
- Condizione `doneWhen`, a scelta tra:
  - `tests`: i test con questi nomi passano;
  - `file`: il file esiste ed esporta questi simboli;
  - `noErrors`: il file non ha errori del compilatore;
  - `manual`: lo spunti tu.
- `evaluate(tasks, signals)`: funzione pura che dice quali compiti sono fatti. Se un test si rompe, il compito torna aperto.
- Stato su disco in `.pebble/percorso.md`, una checklist Markdown (`- [ ]`) leggibile e modificabile a mano, coerente con ADR-002 (ADR-007).

### 2. Segnali locali (`adapters/signals/`)
- **Errori del compilatore**: si leggono da VS Code con `vscode.languages.getDiagnostics()`. Sono già calcolati dal language server, quindi non serve lanciare `tsc`.
- **Test**: un comando configurabile, con default `node --test --test-reporter=tap`. Pebble legge l'output TAP. TAP lo producono anche Vitest, Jest (con un plugin) e pytest (con un plugin), quindi non ci lega a Node.
- **Quando**: al salvataggio, con un ritardo di circa 1 secondo, oppure con il comando "Verifica il percorso". È tutto locale: non chiama il modello e non costa niente.
- Non si possono leggere i risultati dei test lanciati da altre estensioni: l'API di VS Code per farlo è ancora sperimentale. Per questo li lanciamo noi.

### 3. Vista del percorso (`adapters/vscode/pathView.ts`)
- Una `TreeView` nativa con le caselle di spunta (`TreeItem.checkboxState`, disponibile da VS Code 1.80). Accanto a ogni compito, lo stato: "1/4 test".
- Selezionando un compito si vede il dettaglio (cosa fare, firma, quando è fatto). Ci sono due azioni: "Prepara il file" e "Aiutami su questo compito".

### 4. Prepara il file (MODE: SCAFFOLD)
- Il modello risponde con uno schema: percorso, import, dichiarazioni, e per ogni funzione la firma, i passi di pseudocodice e una domanda.
- **Il testo del file lo compone Pebble**, a partire dalle parti dello schema. Il corpo delle funzioni contiene per costruzione solo commenti, quindi la zona C è garantita dalla struttura e non solo dal filtro.
- Prima di scrivere il file, Pebble mostra un'anteprima delle differenze, come per gli ADR proposti nella v0.5.

### 5. Il fumetto (MODE: HELP)
- **Comando**: "Pebble, aiutami qui", con scorciatoia `⌥P` e voce nel menu del tasto destro.
- **Forma**: un riquadro di commento sotto la riga, con la Comments API di VS Code (`createCommentController`). È l'unico modo stabile per avere un riquadro dentro l'editor. I pulsanti stanno sotto il riquadro (menu `comments/commentThread/context`):
  - Più concreto
  - Perché conta?
  - Approfondisci
  - Ho capito
- **Contesto mandato al modello**:
  - la funzione su cui sei e le righe vicine;
  - il compito attivo e l'output dei suoi test che falliscono;
  - il gradino attuale e cosa è già stato detto nel riquadro.
- **Schema della risposta**:
  - il testo del gradino;
  - una domanda facoltativa;
  - un concetto facoltativo per il quaderno (titolo e sintesi).
- **Il gradino 1 è sempre una domanda**: nel mockup, "perché il ciclo salta il 20?".

### 6. Approfondisci e quaderno
- "Approfondisci" chiama MODE: HELP con la richiesta di spiegare il concetto, proporre un'abitudine e lasciare un esercizio.
- Il quaderno sta in `.pebble/quaderno.md` e si vede in una seconda `TreeView`. Ogni concetto ha titolo, sintesi, stato (nuovo, capito, da approfondire) e il compito in cui è nato.

## Decisioni da aggiornare in `.pebble/`

- **ADR-003**: diventa "tre zone". In più, lo scheletro è composto da Pebble a partire da dati strutturati.
- **ADR-004**: superato da ADR-006. L'unica cosa automatica è la verifica locale che spunta i compiti, senza modello.
- **ADR-006 (nuovo)**: Pebble interviene solo su richiesta.
- **ADR-007 (nuovo)**: percorso e quaderno come checklist Markdown in `.pebble/` (nel piano erano JSON, ma contraddiceva ADR-002).
- **ADR-008 (nuovo)**: segnali presi dagli errori di VS Code e da un comando di test con output TAP.
- **ADR-009 (nuovo)**: il fumetto usa la Comments API.

## Roadmap

Ogni passo si può verificare da solo e ne fa partire uno dopo.

| # | Passo | Fatto quando |
|---|---|---|
| 0 | Commit della v0.6, aggiornamento degli ADR qui sopra | `.pebble/` descrive la nuova direzione |
| 1 | `core/path.ts`: modello ed `evaluate`, con test | Coperti i casi: test verde, test che torna rosso, file mancante, compito manuale |
| 2 | Vista del percorso da un `percorso.md` scritto a mano per il passo 2 di mini-calc | In VS Code vedi i compiti e li spunti a mano |
| 3 | Segnali: errori di VS Code e test TAP al salvataggio | Su mini-calc, scrivendo `platesFor`, i compiti si spuntano da soli |
| 4 | MODE: PLAN_STEP: compiti generati dal passo della roadmap, con eval | Il passo 2 di mini-calc genera compiti simili a quelli scritti a mano |
| 5 | Fumetto ⌥P con i quattro gradini e "Perché conta?", con eval | Sul bug `>`/`>=` parte da una domanda e non scrive mai il corpo |
| 6 | Prepara il file: MODE: SCAFFOLD con file composto da Pebble e anteprima | `plates.ts` nasce con firma e pseudocodice, senza corpo |
| 7 | Approfondisci e quaderno | I concetti del fumetto compaiono nel quaderno |
| 8 | Prova reale su mini-calc, dal passo 1 al 3 | Note su cosa è utile e cosa è rumore, come per la v0.5 |

Dopo il passo 3 c'è già qualcosa da provare senza costi di modello: il percorso che si spunta da solo. Il fumetto arriva al passo 5.

## Deciso

- **I test li scrive lo sviluppatore** (2026-11-23). Pebble suggerisce quali casi coprire e propone **un primo test completo** come esempio da cui partire: mostra lo stile, poi gli altri li scrivi tu. Va aggiornata la zona C del prompt v0.4, che oggi vieta qualsiasi test completo: l'eccezione vale solo per il primo test di un compito. La spunta automatica collega i test al compito in base ai nomi proposti nel compito.

## Domande aperte

1. **Linguaggi oltre TypeScript**: i segnali sono generici (errori di VS Code e TAP), ma gli eval coprono solo TypeScript.
2. **Costo del fumetto**: una chiamata per gradino. Con la cache del prompt di sistema e un modello piccolo per i gradini 1 e 2 dovrebbe stare sotto il centesimo, ma va misurato al passo 5.
