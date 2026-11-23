# Roadmap

## Fase 1: mentor in chat (v0.1–v0.6)

| # | Passo | Stato |
|---|---|---|
| 1 | Casi di valutazione del prompt in `evals/` | ✅ 14 casi, prompt v0.4 |
| 2 | Formato strutturato per REVIEW, mappato su Diagnostics | ✅ |
| 3 | `core/policy`: filtro sulle zone con i suoi test | ✅ (aggiornato a tre zone, ADR-003) |
| 4 | Runner degli eval da riga di comando | ✅ `evals/run.py` con Claude Code |
| 5 | Estensione minima: review del file → Diagnostics e pannello | ✅ |
| 6 | `init` da `bootstrap.md` che scrive `.pebble/` | ✅ |
| 7 | Trigger automatici su nuovo file e salvataggio | ⛔ abbandonato (ADR-006) |
| 7b | Livello di esperienza e registro della spesa | ✅ |
| 8 | Prova su un progetto reale | ✅ mini-calc: troppo generico e troppo passivo, da qui la fase 2 |

## Fase 2: il percorso (piano in `docs/piano-pair-engineer.md`)

| # | Passo | Fatto quando |
|---|---|---|
| 0 ✅ | Commit della v0.6 e ADR della nuova direzione (003, 004 superato, 006–009) | `.pebble/` descrive il percorso |
| 1 ✅ | `core/path`: parsing di `percorso.md` ed `evaluate`, con test | Coperti: test verde, test che torna rosso, file mancante, compito a mano, righe sconosciute conservate |
| 2 ✅ | Vista Percorso da un `percorso.md` scritto a mano per il passo 2 di mini-calc | In VS Code vedi i compiti e li spunti a mano, e il file si aggiorna |
| 2b | **Prompt del fumetto (MODE: HELP) e i suoi eval, senza interfaccia.** 3-4 bug reali di mini-calc (`>`/`>=`, kg in float, caso sotto i 20 kg) con l'output dei test rossi | Il gradino 1 è una domanda che non rivela la soluzione e cita l'output del test; il gradino 4 non supera 3 righe; nessun corpo di funzione |
| 3 | Segnali: errori dell'editor e test TAP al salvataggio, con la cronologia "visto rosso" (ADR-010) | Scrivendo `platesFor` su mini-calc, i compiti si spuntano da soli; un test mai visto fallire mostra l'avviso |
| 4 | MODE: PLAN_STEP: i compiti del prossimo passo, generati dal codice com'è adesso e proposti come diff (ADR-011), con eval | Chiuso il passo 1 di mini-calc, "Prepara il passo 2" propone compiti simili a quelli scritti a mano, con i casi di test e un primo test d'esempio |
| 4b | Il sentiero che cresce: condizioni da aggiornare quando un file o un test sparisce, "Aggiungi al percorso" dal fumetto e dalla review, passi chiusi compressi (ADR-011) | Rinominare `plates.ts` segnala i compiti da aggiornare e propone la correzione |
| 5 | Fumetto `⌥P` con i quattro gradini e "Perché conta?", con eval | Sul bug `>`/`>=` parte da una domanda e non scrive mai il corpo |
| 6 | Prepara il file: MODE: SCAFFOLD, scheletro composto da Pebble con anteprima | `plates.ts` nasce con firma e pseudocodice, senza corpo |
| 7 | Approfondisci e Quaderno | I concetti del fumetto finiscono in `quaderno.md` |
| 8 | Prova reale su mini-calc, passi 1–3 | Note su cosa è utile e cosa è rumore |

## Da dove partire
**Passo 2b, il prompt del fumetto.** È il rischio più alto del progetto: fare domande utili invece di dare risposte è la parte più difficile, ed è il prodotto. Si verifica con gli eval prima di costruire l'interfaccia. Se il modello non regge lì, lo scopriamo presto.

## Da decidere più avanti
- Prompt, ADR ed eval in inglese, ora che il repo è pubblico.
- Modello di business: il progetto è open source con licenza MIT; un'eventuale offerta per team non cambia l'architettura.
