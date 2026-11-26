<p align="center"><img src="https://raw.githubusercontent.com/LordKenzo/pebble-code-companion/main/assets/banner.jpg" alt="Pebble, the Code Path Companion: a developer at the keyboard and a trail of glowing pebbles through a night forest" width="900"></p>

# Pebble · Code Path Companion

**Cammina sul sentiero, il codice lo scrivi tu.** Un pair engineer in VS Code: trasforma il progetto in un percorso di piccoli passi, prepara ogni file con firme e pseudocodice, verifica i progressi con i tuoi test e ti aiuta a ragionare quando sei bloccato. Quando chiedi il codice lo scrive, nella forma adatta al tuo livello; con l'allenamento attivo la logica resta tua.

*Read it in English: [README.md](README.md).*

## Beta: cosa aspettarsi
Pebble è in **pre-release**: funziona, e lo stiamo costruendo allo scoperto. Prima di provarlo:
- **Serve un modello.** Una chiave API di Anthropic o OpenAI (**Pebble: Imposta la chiave API**), oppure un server locale come Ollama, gratuito e con il codice che resta sul tuo computer. I modelli locali seguono le regole di Pebble meno bene di quelli cloud.
- **Progetti nuovi o già avviati.** Pebble ti guida da `bootstrap.md`, oppure adotta un progetto già avviato; poi lavora su sentieri brevi per singole funzionalità e bug.
- **È onesto sulle spunte.** Un compito spuntato vuol dire che i tuoi test passano, non che il codice è corretto.
- **Nessuna telemetria.** Pebble non raccoglie niente. Il tuo codice va solo al provider che scegli.
- Segnalazioni e bug: [issue su GitHub](https://github.com/LordKenzo/pebble-code-companion/issues).

## Per iniziare
1. Apri la vista **Pebble** nella barra laterale (l'icona con i sassolini), oppure lancia **Pebble: Inizia**.
2. **Racconta il progetto**: rispondi a qualche domanda e Pebble scrive `bootstrap.md`, oppure scrivilo tu da una traccia.
3. **Proponi il piano**: Pebble propone decisioni (ADR), architettura e roadmap. Le leggi e le salvi in `.pebble/`.
4. **Prepara il passo 1**: il passo diventa una checklist di compiti, ognuno con quello che si aspetta.

## Cosa fa
- **Il pannello Percorso** legge `.pebble/percorso.md`. I compiti si spuntano da soli quando salvi: Pebble lancia i tuoi test (qualsiasi runner con output TAP; Vitest lo riconosce dal `package.json`), legge gli errori del compilatore che VS Code ha già e controlla file e dipendenze. Un test mai visto fallire è segnato con "!".
- **Cosa mi aspetto**: ogni compito spiega cosa lo chiude, con un esempio del nome del test.
- **Prepara il file**: import, tipi, la firma e lo pseudocodice come commenti, con il corpo vuoto. Per un file di test, un test completo d'esempio e gli altri casi come `test.todo`. Mostrato come diff: **Accetta**, **Revisiona e modifica** o **Scarta**.
- **Prepara il passo N**: chiuso un passo, Pebble prepara il successivo partendo dal codice com'è adesso.
- **⌥P, il pannello di aiuto** (**Alt+P**, Option+P su Mac, o tasto destro → *Pebble, aiutami qui*): un breve menu, poi un pannello accanto al codice. Senza selezione: *Suggerimenti sul file*, *Da studiare*, *Pseudocodice per ciò che manca* (da inserire come commento). Con codice selezionato: *Spiegami questo codice*, *Cosa studiare qui*, *Esempi simili*. Con test rossi, la scala di aiuto: parte da una domanda, sale solo quando lo chiedi (*Più concreto*, *Perché conta?*, *Approfondisci*), ti dà il codice corretto con *Mostrami il codice* (non in allenamento) e se il file non compila sistema prima quello. La profondità segue il tuo livello.
- **Nomi dei test a richiesta**: ogni passo elenca i nomi dei test che i compiti si aspettano, con lo stato (verde, rosso, non trovato), pronti da copiare.
- **Adotta un progetto già avviato**: con codice e senza `.pebble/`, Pebble legge il progetto, propone le decisioni che ci trova, da confermare, e chiude un campo base con lo stato dei tuoi test.
- **La mappa del sentiero** (icona mappa in testa al pannello Percorso): la roadmap intera come un sentiero di sassolini, e accanto il **diario** di ogni passo, che Pebble scrive in `.pebble/diario.md` mentre lavori, senza modello. **Rivedi il passo** chiede al Mentor cosa hai costruito e cosa resta fragile.
- **La conversazione con il Mentor**: domande libere, `/review`, `/tests`, `/next`, `/init`. Le review compaiono anche come note nell'editor.

## Lingua
`pebble.language`: `auto` (segue VS Code), `it` o `en`. Interfaccia, file che Pebble scrive e risposte del modello la seguono. Si cambia anche da **Pebble: Impostazioni**.

## Provider
| `pebble.provider` | Cosa serve |
|---|---|
| `anthropic` (predefinito) | Una chiave API Anthropic (**Pebble: Imposta la chiave API**) |
| `openai` | Una chiave API OpenAI e `pebble.openai.model` |
| `local` | Un server con API compatibile OpenAI, senza chiave. Ollama: `http://localhost:11434/v1` e per esempio `qwen3-coder:30b` |

Il codice va al provider che scegli; con `local` non esce dal computer. I modelli locali non costano, ma rispettano meno le regole di Pebble: per fumetto, piano e *Prepara il file* un modello cloud funziona meglio.

## Livello di esperienza
`pebble.experienceLevel`: `entry`, `junior`, `mid` (predefinito), `senior`. Cambia cosa Pebble segnala, come lo spiega e la forma del codice che chiedi: entry riceve codice completo spiegato riga per riga, junior codice completo con il principio dietro, mid codice asciutto con le scelte motivate, senior una patch mirata con il compromesso. Senza richiesta Pebble indica e spiega; il codice entra nei tuoi file solo se lo copi o lo approvi, e il diario lo segna.

`pebble.training` (spento di default): Pebble non scrive la logica del progetto, anche se glielo chiedi; la scala di aiuto si ferma alla riga esatta.

## Spesa
Ogni richiesta registra i token restituiti dal provider e stima il costo (i prezzi Claude sono inclusi; gli altri in `pebble.prices`). Il totale del mese è nella barra di stato; `pebble.monthlyBudgetUsd` ti avvisa quando lo superi. **Pebble: Mostra la spesa** dà il dettaglio.

## Modalità con restrizioni
In una cartella non attendibile Pebble funziona ma non lancia i comandi dei test. Considera attendibile la cartella perché i compiti si spuntino da soli.
