## ADR-003: Tre zone di aiuto; la logica la scrive lo sviluppatore
Stato: accettato (aggiornato il 2026-11-23, sostituisce la versione "niente codice")
Contesto: la prima versione vietava qualsiasi blocco oltre 3 righe. Nella prova su mini-calc questo ha bloccato lo sviluppatore su `package.json` e `tsconfig`. Pebble ripeteva "crea quei file" senza mai mostrare come, e il filtro avrebbe cancellato anche una configurazione completa. Il vincolo serve a proteggere la logica, non la configurazione.
Decisione: tre zone, nel prompt e nel filtro di `core/policy`.
- **A, comandi e configurazione**: completi, con le voci spiegate.
- **B, struttura** (cartelle, firme, tipi, scheletri): proposte concrete, con un blocco di sole dichiarazioni fino a 20 righe.
- **C, logica**: domande, pseudocodice, un esempio analogo, al massimo 3 righe sul punto preciso. Mai il corpo di una funzione.
- **Test**: li scrive lo sviluppatore. Pebble suggerisce i casi e propone un solo test completo per compito, come esempio dello stile.
- **"Prepara il file"**: lo scheletro lo compone Pebble a partire da dati strutturati (import, firme, passi di pseudocodice), così il corpo contiene per costruzione solo commenti.
Il filtro resta la seconda difesa. Lascia passare configurazione, comandi (non heredoc o `node -e`), alberi di cartelle e blocchi di sole dichiarazioni. Toglie tutto il resto oltre 3 righe.
Alternative scartate: il divieto totale (blocca sull'impalcatura e non insegna niente); fidarsi solo del prompt (sotto pressione cede); scheletro generato come testo libero dal modello (il corpo potrebbe contenere codice).
Conseguenze: prompt v0.4 con la scala di aiuto, eval 11–14. Il filtro deve distinguere configurazione e dichiarazioni dal codice: le euristiche sono coperte da test. Il test d'esempio è un'eccezione stretta alla zona C, da verificare con un eval.

Precisazione 2026-11-23, da chi ci difende il filtro: chi usa Pebble vuole scrivere la logica, altrimenti userebbe uno strumento che la scrive. Il filtro non deve resistere a chi cerca di aggirarlo: deve evitare che Pebble consegni la logica per sbaglio. Il confine garantito è lo scheletro composto da Pebble, il cui corpo contiene per costruzione solo commenti. Il filtro sulle risposte libere (chat, fumetto) resta una seconda difesa euristica, e non conviene renderlo più sofisticato di così. La zona grigia tra struttura e logica (es. un tipo con i suoi valori) si verifica con gli eval, non con il filtro.
