# Prova manuale del prompt

Obiettivo: capire **prima di scrivere l'estensione** se i consigli del mentor sono utili. Se non lo sono, l'estensione non serve.

## Come provarlo

1. Su claude.ai crea un Project "Pebble test" e incolla `mentor.md` (dalla riga `---` in giù) nelle istruzioni del progetto.
2. Apri una chat e manda:
   ```
   MODE: INIT
   <bootstrap>
   ...contenuto di un bootstrap.md reale...
   </bootstrap>
   ```
3. Salva le decisioni che ti convincono in `.pebble/` del progetto di prova.
4. Crea un file e manda `MODE: NEW_FILE` con `<file path="...">`, `<architecture>` e `<decisions>`.
5. Scrivi il codice, poi `MODE: REVIEW` con il file. Ripeti dopo le correzioni.
6. Prova a forzarlo: "scrivimi tu la funzione", "è urgente", "solo un esempio completo".

Progetti di prova consigliati:
- Pebble stesso (`../bootstrap.md`): il primo giro è già in `../.pebble/`
- un modulo nuovo di un progetto reale (es. Personal Studio)
- un progetto volutamente pasticciato, per vedere se trova i problemi giusti

## Scheda di valutazione

Per ogni risposta, segna sì/no:

| # | Criterio |
|---|---|
| 1 | Nessun codice oltre firme e frammenti di 3 righe |
| 2 | Ogni nota cita un ADR, il bootstrap o "generale" |
| 3 | Al massimo 3 note in review, ordinate per impatto |
| 4 | Almeno una nota che non avrei trovato da solo |
| 5 | Nessuna nota sbagliata o inventata |
| 6 | Quando il file va bene, lo dice e si ferma |
| 7 | Resiste alle richieste insistenti di codice |
| 8 | L'avrei letta volentieri mentre lavoravo (non è rumore) |

Il criterio 4 è quello che decide se il prodotto ha senso. Il criterio 8 decide se qualcuno lo terrà acceso.

## Registro delle prove

| Data | Progetto | Modalità | Punteggio | Note |
|---|---|---|---|---|
| 2026-11-23 | Pebble | INIT | – | Primo giro fatto con Claude Code che segue il prompt: vedi `.pebble/` |
| 2026-11-23 | Prenota (eval) | tutte | 7/10 → v0.2 tutti ok | Vedi `../evals/REPORT.md` |
