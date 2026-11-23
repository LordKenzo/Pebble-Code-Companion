# Risultati degli eval

Eseguiti il 2026-11-23 con `python3 evals/run.py`: Claude Code in modalità headless, con solo il prompt di sistema, nessun tool e nessun contesto di questa conversazione.
Le risposte complete sono in `runs/`.

## Prompt v0.1 (`runs/2026-11-23_0946`)

| Caso | Esito | Note |
|---|---|---|
| 01 INIT completo | ✅ con riserve | Tutti i punti richiesti, più il bonus sulla concorrenza del lunedì. Però ADR dentro blocchi di codice, due domande, circa 1.200 parole |
| 02 INIT vago | ✅ con riserve | Si ferma e non inventa requisiti. Però alla domanda aggiunge un elenco di altre richieste |
| 03 NEW_FILE dominio | ✅ | Ruolo, cosa evitare con ADR-002, una sola firma |
| 04 NEW_FILE fuori posto | ✅ | Dice che il file non sta in domain e propone porta + adapter. Bonus: chiede se la prenotazione resta valida quando l'email non parte |
| 05 REVIEW con difetti | ✅ | Trova pg, eccezione e `Date.now()`, in più la race condition. Note dentro blocchi di codice |
| 06 REVIEW file pulito | ⚠️ | Gravità gonfiata: "avviso" per un parametro non usato, più una seconda nota generica |
| 07 REVIEW race condition | ✅ | Race come prima nota, con gravità errore e ancorata a bootstrap e ADR-003. Trova anche tutti i bonus (`clock` non usato, scritture non atomiche, lista d'attesa) |
| 08 TESTS | ✅ | Casi limite per primi, test che guida la lista d'attesa, nota sul test di integrazione per la concorrenza |
| 09 CHAT sotto pressione | ✅ | Rifiuta in una frase, propone un adapter in memoria per la demo, checklist solida |
| 10 CHAT aggirata, in inglese | ✅ | Risponde in inglese, nessun test completo, solo una riga d'esempio |

Il criterio decisivo, *"c'è almeno una nota che non avrei trovato da solo"*, è soddisfatto in 01, 04, 05, 07 e 08.

## Correzioni nella v0.2

1. Note e ADR in testo normale, mai dentro blocchi di codice (servirà anche per estrarre le note in modo affidabile).
2. Al massimo una domanda per risposta, in tutto.
3. Indicazioni sulla lunghezza (circa 60 parole per nota, 700 per INIT, 300 per le altre modalità).
4. Gravità ridefinita, con la regola "nel dubbio, la più bassa" e "file a posto = una riga più al massimo una nota info".

## Prompt v0.2 (`runs/2026-11-23_0948`, casi 01, 02, 05, 06)

| Caso | Esito | Note |
|---|---|---|
| 01 | ✅ | ADR in testo, nessuna domanda superflua. Ancora lungo (circa 920 parole contro le 700 indicate) |
| 02 | ✅ | Una sola domanda |
| 05 | ✅ | Tre note in testo normale. Ha accorpato pg ed eccezione per far posto alla race condition, scelta corretta |
| 06 | ✅ | Una riga di conferma più una nota info |

## Modello locale (estensione v0.1, qwen3-coder:30b via Ollama)

| Caso | Esito | Note |
|---|---|---|
| 05 REVIEW con difetti | ✅ con riserve | Trova pg, eccezione e `Date.now()` in 16 s. Righe imprecise (3 invece di 1), ADR proposto in formato lungo, nessuna race condition |
| 07 REVIEW race condition | ❌ | Una sola nota "info generale" sulle scritture separate. Non vede la race, che è proprio la nota di valore |

Conclusione: il locale va bene per le violazioni evidenti degli ADR, non per le note che giustificano il prodotto. Da rendere chiaro nelle impostazioni.

## OpenAI (estensione v0.2, gpt-6.2-sol)

| Caso | Esito | Note |
|---|---|---|
| 07 REVIEW race condition | ✅ | Race come prima nota (errore, ADR-003), lista d'attesa come seconda. 12 s, 2.619 token in, 460 out |
| 05 a livello entry | ✅ dopo correzione | Prima della correzione era quasi identico a senior. Con il promemoria del livello nel messaggio: termini spiegati tra parentesi, passi numerati, cosa va bene nella sintesi |
| 05 a livello senior | ✅ | Note asciutte, alternative con il loro costo (lock di riga o aggiornamento condizionale). Ha trovato anche il limite delle 12 ore esatte |

Lezione: le istruzioni sul livello vanno ripetute accanto alla richiesta, non solo nel prompt di sistema.

## Prompt v0.4 (`runs/2026-11-23_1810`, `_1812`, `_1813`)

Nasce dalla prova reale su mini-calc (estensione v0.5, gpt-6-sol). Pebble diceva "prepara package.json e tsconfig" senza mai mostrare come. Alla richiesta di un esempio ripeteva la stessa nota e attribuiva all'ADR-005 anche le regole di npm. Le buone pratiche non arrivavano mai.

Cambiamenti:
1. **Tre zone.** A, comandi e configurazione: completi. B, struttura: proposte concrete, con un blocco di sole dichiarazioni fino a 20 righe. C, logica: resta il divieto.
2. **Scala di aiuto.** Indizio, direzione precisa, esempio, riga esatta. "Fammi un esempio" fa salire di un gradino.
3. **Buone pratiche segnalate sempre**, ancorate a `buona pratica` e non a un ADR.
4. **Fase del progetto.** Propositivo all'avvio, socratico nella logica, compagno di progettazione nelle decisioni.
5. **Usa il contesto che hai**: non chiede di incollare file già presenti.
6. Il filtro `core/policy` e il controllo di `run.py` lasciano passare configurazione, comandi (non heredoc o `node -e`), alberi e blocchi di sole dichiarazioni.

| Caso | Esito | Note |
|---|---|---|
| 11 NEXT setup, entry (nuovo) | ✅ | Comandi in ordine, package.json, tsconfig e .gitignore completi con le voci spiegate, verifica con `npm run check`. Prima: "crea i file" |
| 12 REVIEW package.json (nuovo) | ✅ con riserve | Riga corretta esatta, comando di installazione, file completi, `buona pratica` dove serve. Il glob punta a `src/` invece che a `test/` come da architettura |
| 13 CHAT "Fammi un esempio" (nuovo) | ✅ | Sale di gradino: package.json completo con ogni voce spiegata. Inventa il nome del progetto ("one-rep-max") |
| 14 CHAT logica protetta (nuovo) | ✅ | Rifiuta la funzione, dà la firma, l'esempio analogo del resto in monete, una checklist con gli ADR e i test da cui partire |
| 01–10 (regressione) | ✅ | Nessun blocco di logica. 02 resta a una domanda, ma con due opzioni e una raccomandazione. 03 e 09 propongono scheletri di sole firme (ammessi dalla zona B). 01 resta lungo (circa 1.000 parole) |

Limite: gli eval girano con Claude (`claude -p`), mentre la prova su mini-calc usava gpt-6-sol. Va ripetuta nell'estensione con il provider che usi.

## Prompt v0.5: il fumetto, MODE: HELP (`runs/2026-11-23_2025`, `_2026`)

Passo 2b della roadmap: il rischio più alto (fare domande utili invece di dare risposte) verificato prima di costruire l'interfaccia. Tre bug reali di mini-calc con l'output dei test rossi (fixture in `fixtures/mini-calc/src/`):
- `>` invece di `>=` nel ciclo dei dischi;
- kg in virgola mobile: `175 * (70 / 100)` dà 122,49999999999999 e il carico scende a 120;
- il caso sotto i 20 kg mancante.

| Caso | Esito | Note |
|---|---|---|
| 15 gradino 1, cursore sulla riga sbagliata | ✅ dopo correzione | Prima: ottima domanda sui 22,5 kg, ma la riga finale "Concetto: errore di confine" rivelava la risposta. Dopo: domanda sul valore 20.000 alla riga del while, senza concetto |
| 16 gradino 4 | ✅ | Una riga di codice (`>=`), spiega l'output dei 60 kg. Propone un test di proprietà ("la somma dei dischi torna al totale"), migliore di quello atteso |
| 17 gradino 1, virgola mobile | ✅ dopo correzione | La domanda chiede di stampare `targetKg` "cifra per cifra". Prima della correzione rivelava "aritmetica in virgola mobile" nella riga Concetto |
| 18 gradino 2, entry | ✅ con riserve | Direzione chiara, termini spiegati, cita ADR-004 e suggerisce di guardare `result.ts`. Circa 120 parole contro le 90 indicate |
| 19 approfondimento | ✅ con riserve | Concetto, abitudine ed esercizio (spedizione gratuita da 50 €) ben fatti, nessuna correzione. Circa 160 parole contro 140; non nota l'algoritmo greedy |

Correzione nel prompt: la riga Concetto solo dal gradino 2; al gradino 1 la domanda può dire dove guardare, non cosa c'è di sbagliato.

Aperto: la lunghezza a livello entry tende a sforare; da ricontrollare con gpt-6-sol nell'estensione, perché questi eval girano con Claude.

## Prompt v0.6: il prossimo passo, MODE: PLAN_STEP (caso 20)

Passo 4 della roadmap: Pebble scompone il prossimo passo dal codice com'è adesso (ADR-011). Il caso usa mini-calc con il setup già fatto e chiede il passo 2.

| Prova | Esito | Note |
|---|---|---|
| Primo giro | ⚠️ caso rotto | Il percorso incollato nel caso conteneva "## Passo 1", e il runner taglia la sezione Input alla prima riga che inizia con "## ". Spostato in un fixture incluso |
| Secondo giro | ✅ con riserve | Non ripropone il setup, aggiunge il modulo `units` mancante (ADR-003), test prima dell'implementazione, casi anomali come esiti (ADR-004), finale "Rileggi con Pebble". Ma i nomi nelle condizioni ("22,5 kg in grammi") non comparivano tra i casi del compito dei test: il compito sarebbe rimasto su "test non trovato" |
| Terzo giro, dopo la correzione | ✅ | Nomi esatti dei test tra virgolette nel compito dei test, condizioni con la loro parte iniziale. Verificato con `planToSection` e `testNameMatches`: nessuna condizione scartata, ogni nome nelle condizioni corrisponde a un caso elencato |

Correzione nel prompt: nel compito dei test i casi sono nomi esatti tra virgolette, che iniziano con il dato del caso; le condizioni `test "…"` usano la parte prima dei due punti.

Run: `runs/2026-11-23_2057`, `runs/2026-11-23_2058`, `runs/2026-11-23_2059`.

## Prompt v0.7: "Prepara il file", MODE: SCAFFOLD (casi 21, 22)

Passo 6 della roadmap. Il modello restituisce le parti dello scheletro, Pebble compone il testo con `composeScaffold` e scarta ogni parte con logica: costanti non letterali, tipi con corpi, firme con corpo, più di un test completo.

| Caso | Esito | Note |
|---|---|---|
| 21 scheletro di src/core/plates.ts | ✅ | Import con `.ts`, costanti in grammi dal bootstrap, `PlateLoad`, firma di `platesFor`, sei passi di pseudocodice con gli ADR, domanda "calcola a mano 142,5 kg". Nessuna parte scartata |
| 22 file di test, primo giro | ⚠️ | Un solo test d'esempio e gli altri come `test.todo`, ma chiamava `platesPerSide`: il nome previsto (`platesFor`) stava in un altro compito del passo e `plates.ts` non esisteva ancora |
| 22 dopo la correzione | ✅ | Con `FIRME PREVISTE NEL PASSO` usa `platesFor`. Esempio sul caso dei 15 kg (avviso), gli altri quattro casi come `test.todo`. Nessuna parte scartata |

Correzione: il messaggio porta le firme previste dagli altri compiti del passo, e il prompt chiede di usarle esattamente.

## Prompt v0.8: gli errori dell'editor prima di tutto (caso 23, prova reale)

Dalla prova reale sul progetto `prova` (React + Vite, con qwen3-coder locale). Vitest e Testing Library non erano installati, il compito di installazione si era spuntato per una condizione troppo debole ("esiste package.json"), e il test non compilava. Fumetto e review non ricevevano gli errori dell'editor: il fumetto ha fatto una domanda sul titolo, la review ha sostenuto che mancava un import che c'era.

Correzioni: blocco `<problems>` con gli errori dell'editor nel fumetto e nella review; nel fumetto "Prima sistemiamo il file" con correzioni concrete prima di qualsiasi domanda; condizione `dipendenza nome`; comando dei test scelto dal package.json (Vitest con `--reporter=tap-flat`).

| Prova | Esito | Note |
|---|---|---|
| Caso 23 con Claude | ✅ | Installazione, import da vitest, parentesi da chiudere con la riga, termini spiegati per il livello entry. Nessuna domanda, nessun codice di App.tsx |
| Stesso messaggio con qwen3-coder:30b, fumetto | ✅ con riserve | Con gli errori nel contesto trova installazione e parentesi, ma non segue il formato (numera i punti come "Gradino 1, 2, 3") e scrive il contenuto di App.tsx (zona C) |
| Stesso messaggio con qwen3-coder:30b, review | ⚠️ | Non contraddice più gli errori, ma propone Jest in un progetto Vite che pianifica Vitest, e restituisce "try" come lista invece che come testo (nell'estensione lo schema strutturato lo impedisce) |

Conclusione: il contesto giusto aiuta molto anche il modello locale, ma per fumetto e passi generati un modello cloud resta più affidabile nel rispettare le zone.

## Prompt v0.9: inglese e italiano (ADR-012)

Prompt inglese (`mentor.en.md`) tradotto regola per regola dall'italiano, più la riga `LINGUA:` in tutti i messaggi. Provato con Claude su due casi esistenti, con codice e nomi dei test in italiano e `LINGUA: en`:

| Caso | Esito | Note |
|---|---|---|
| 23 file che non compila | ✅ | "Let's fix the file first": installazione, import da vitest, parentesi da chiudere, termini spiegati per il livello entry |
| 15 gradino 1 | ✅ | Una domanda sul test dei 60 kg e sulla riga del while, senza nominare la soluzione né il concetto |

Aperto: gli eval sono ancora solo in italiano; servono casi in inglese prima del lancio.

## Aperto

- INIT è ancora oltre la lunghezza indicata: valutare se dividere la risposta (prima le decisioni, poi su richiesta roadmap e cartelle).
- Il controllo automatico verifica solo i blocchi di codice (con le eccezioni delle zone A e B). Il resto, per ora, si valuta a mano.
- Mancano casi su linguaggi diversi da TypeScript e su progetti senza `.pebble/`.
