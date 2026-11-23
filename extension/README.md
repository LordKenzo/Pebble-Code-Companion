# Pebble per VS Code (v0.5)

Rivede il file aperto rispetto a `bootstrap.md` e alle decisioni in `.pebble/`. Non scrive codice.

## Uso
- **Pannello laterale Pebble** (icona con tre sassolini nella barra a sinistra): la conversazione con il mentor.
  - All'apertura di un progetto con `bootstrap.md` e senza `.pebble/` lo legge da solo e propone il piano; **Salva in .pebble/** scrive architettura, roadmap e ADR.
  - Senza `bootstrap.md` ti propone di crearlo da un modello.
  - Quando crei un file ti dice che ruolo ha, cosa deve fare e cosa evitare.
  - Nel campo: domande libere, oppure `/review`, `/tests`, `/next`, `/init`, `/clear`.
  - Sotto l'ultima risposta: **Approfondisci** e **Fammi un esempio** (scenari con valori reali o pseudocodice, mai codice pronto).
  - Se una risposta cambia una decisione, compaiono **Vedi ADR-NNN** (confronto attuale ↔ proposta) e **Aggiorna/Crea ADR-NNN**, che scrive il file in `.pebble/decisions/`.
- **Pebble: Impostazioni**: pannello con provider e modello (con verifica della connessione e, per Ollama, l'elenco dei modelli installati), chiavi API, livello di esperienza, budget e prezzi. Si apre anche da "Impostazioni" in cima al pannello delle review.
- **Pebble: Rivedi il file** (`⌘⌥R`, o tasto destro nell'editor): le note compaiono come sottolineature e nel pannello a destra. Clicca "riga N" per saltare al punto.
- **Pebble: Imposta la chiave API**: salva la chiave nel portachiavi di VS Code (Anthropic, OpenAI o server locale).
- **Pebble: Imposta il mio livello di esperienza**: `entry`, `junior`, `mid`, `senior` (impostazione `pebble.experienceLevel`).
- **Pebble: Mostra la spesa**: token e costo stimato per mese e per modello. Il totale del mese è anche nella barra di stato.
- **Pebble: Rimuovi le note**: le note spariscono anche da sole appena modifichi il file.

## Livello di esperienza
| Livello | Cosa cambia |
|---|---|
| `entry` | Parole semplici, ogni termine tecnico spiegato, "Prova" in 2-3 passi numerati, dice anche cosa va bene |
| `junior` | Il perché con il nome del principio in gioco, cosa cercare per approfondire |
| `mid` | Predefinito |
| `senior` | Solo bug, ADR e trade-off; note brevi, alternative con i loro costi |

Sempre: niente codice, al massimo 3 note.

## Spesa
Ogni review registra i token restituiti dal provider e ne stima il costo. I prezzi dei modelli Claude sono inclusi; per OpenAI o altri modelli impostali in `pebble.prices` (dollari per milione di token), altrimenti vedi solo i token. I modelli locali costano $0. Con `pebble.monthlyBudgetUsd` ricevi un avviso quando superi il budget. Il registro resta sul tuo computer; la cifra esatta è nella console del provider.

## Provider (`pebble.provider`)
| Valore | Cosa serve |
|---|---|
| `anthropic` (predefinito) | Chiave API Anthropic. Modello `pebble.anthropic.model`, profondità `pebble.anthropic.effort` |
| `openai` | Chiave API OpenAI e `pebble.openai.model` |
| `local` | Un server con API compatibile OpenAI. Ollama: `pebble.local.baseUrl` = `http://localhost:11434/v1`, `pebble.local.model` = es. `qwen3-coder:30b` |

Il codice del file viene inviato al provider scelto. Con `local` non esce dal computer.

## Sviluppo
```
npm install
npm test            # test del core (filtro "niente codice", contesto)
npm run package     # crea pebble-0.7.8.vsix
code --install-extension pebble-0.7.8.vsix --force
```
Prova senza VS Code, sui fixture degli eval:
```
npx esbuild scripts/try-review.ts --bundle --platform=node --outfile=out/try.js
node out/try.js local qwen3-coder:30b                 # Ollama
PEBBLE_API_KEY=... node out/try.js anthropic claude-opus-5-5
```

Il prompt viene copiato da `../prompts/mentor.md` a ogni build.
