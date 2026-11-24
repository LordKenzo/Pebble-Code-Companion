# Pebble · Code Path Companion

**Cammina sul sentiero, il codice lo scrivi tu.** Un pair engineer in VS Code: trasforma il progetto in un percorso di piccoli passi, prepara ogni file con firme e pseudocodice, verifica i progressi con i tuoi test e ti aiuta a ragionare quando sei bloccato. Non scrive mai la logica del progetto al posto tuo.

*Read it in English: [README.md](README.md).*

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
- **Il fumetto** (**Alt+P**, Option+P su Mac, o tasto destro → *Pebble, aiutami qui*): se il file non compila sistema prima quello, in modo concreto; altrimenti parte da una domanda costruita sul test rosso e sale la scala di aiuto solo quando lo chiedi (*Più concreto*, *Perché conta?*, *Approfondisci*). Puoi rispondere alle sue domande.
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
`pebble.experienceLevel`: `entry`, `junior`, `mid` (predefinito), `senior`. Cambia cosa Pebble segnala e come lo spiega. A ogni livello Pebble non scrive la tua logica.

## Spesa
Ogni richiesta registra i token restituiti dal provider e stima il costo (i prezzi Claude sono inclusi; gli altri in `pebble.prices`). Il totale del mese è nella barra di stato; `pebble.monthlyBudgetUsd` ti avvisa quando lo superi. **Pebble: Mostra la spesa** dà il dettaglio.

## Modalità con restrizioni
In una cartella non attendibile Pebble funziona ma non lancia i comandi dei test. Considera attendibile la cartella perché i compiti si spuntino da soli.
