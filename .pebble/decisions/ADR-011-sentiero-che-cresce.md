## ADR-011: Il sentiero si traccia un passo alla volta e cresce con il codice
Stato: proposto
Contesto: scrivendo codice il piano cambia. Si scoprono casi (il test dei 70 kg nato da un bug), si rinominano file, si cambia idea, nasce un ADR, la roadmap si sposta. Un percorso scritto tutto all'inizio diventa falso presto, e un percorso falso è peggio di nessun percorso: ti porta fuori strada con sicurezza.
Decisione:
- **Davanti, solo il prossimo passo.** Solo il passo corrente è scomposto in compiti; quelli futuri restano titoli della roadmap. Quando un passo si chiude, la vista lo dice ("Passo 2 fatto") e offre "Prepara il passo 3". Pebble scompone il passo partendo dal codice com'è adesso: file reali, ADR, quaderno, compiti già fatti (MODE: PLAN_STEP).
- **Mai riscritture silenziose.** Ogni modifica di Pebble al percorso è una proposta, mostrata come diff da accettare o scartare, come gli ADR proposti dalla v0.5. L'unica scrittura automatica resta la casella (ADR-008).
- **La deriva si vede.** Se una condizione cita un file che non esiste più o un test che non si trova, il compito lo segnala ("condizione da aggiornare") e Pebble, su richiesta, propone la correzione.
- **Le scoperte entrano nel percorso.** Dal fumetto, dalla review o da un test rosso inatteso, "Aggiungi al percorso" propone un compito nel passo corrente (es. il test dei 70 kg suggerito al gradino 4).
- **Dietro di te restano i sassolini.** I compiti fatti non si cancellano: sono la storia del progetto, come i sassolini di Pollicino. Nella vista i passi chiusi si comprimono.
- **Roadmap e decisioni nuove.** Se cambia `roadmap.md` o arriva un ADR, Pebble può proporre di aggiornare il passo corrente. I passi chiusi non si toccano.
Alternative scartate: pianificare tutto all'inizio (invecchia subito); lasciare che Pebble riscriva il percorso da solo (perdi il controllo, e i diff diventano rumore); percorso fisso, modificabile solo a mano (muore alla prima sorpresa).
Conseguenze: PLAN_STEP diventa "scomponi il prossimo passo dal codice com'è ora". Serve un meccanismo di proposta con diff per `percorso.md`, riusando quello degli ADR. `evaluate` deve distinguere "test non trovato" (possibile deriva) da "test rosso" (lavoro da fare), e lo fa già nel motivo.
