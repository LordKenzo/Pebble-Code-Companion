# Roadmap

| # | Passo | Fatto quando |
|---|---|---|
| 1 ✅ | **Casi di valutazione del prompt**: 8-10 casi (bootstrap + file + cosa ci si aspetta) in `evals/`, eseguiti a mano con la scheda di `prompts/README.md` | Ogni caso ha un punteggio e il prompt è passato almeno a v0.2 |
| 2 ✅ | Formato strutturato per REVIEW (note come dati, non solo testo), da mappare su Diagnostics | Il prompt produce note valide in tutti i casi di eval |
| 3 ✅ | `core/policy`: filtro "niente codice" con i suoi test | I casi "insistenza" e "blocco lungo" sono coperti da test |
| 4 | Runner degli eval da riga di comando, via API | I casi del passo 1 girano con un comando |
| 5 ✅ | Estensione minima: comando "Pebble: rivedi il file" → Diagnostics + pannello | Funziona su un progetto reale |
| 6 ✅ | `/init` da `bootstrap.md` che scrive `.pebble/` | Rigenera questa cartella partendo dal bootstrap |
| 7 🟡 | Trigger automatici su nuovo file (fatto) e salvataggio (da fare) | Euristica ADR-004 attiva, nessuna review su modifiche banali |
| 7b ✅ | Livello di esperienza (entry, junior, mid, senior) e registro della spesa con budget | Le risposte cambiano davvero tra entry e senior; costo stimato per review e per mese |
| 8 | Feedback "utile / rumore" su ogni nota, salvato in locale | Si può calcolare la percentuale di note utili |

## Da dove partire
**Passo 1, i casi di valutazione.** Il prompt è il prodotto: se i consigli non sono utili su 10 casi scritti a mano, nessuna estensione li renderà utili. È anche il passo più economico per cambiare idea.

## Da decidere più avanti
- Modello di business (open source, freemium, licenza per team): non cambia l'architettura dei passi 1-5. Rivalutare dopo il passo 5, quando c'è qualcosa da far provare.
