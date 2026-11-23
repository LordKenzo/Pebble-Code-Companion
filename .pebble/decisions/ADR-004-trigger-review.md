## ADR-004: La review automatica parte solo per modifiche sostanziali
Stato: proposto
Contesto: il bootstrap chiede quando una modifica merita una review. Recensire ogni salvataggio costa e trasforma Pebble in rumore.
Decisione: al salvataggio, review automatica solo se dall'ultima review: almeno 15 righe cambiate, oppure cambiano import o export, oppure è il primo salvataggio con contenuto di un file nuovo. Al massimo una review automatica per file ogni 2 minuti. La review manuale è sempre possibile. Le soglie sono configurabili.
Alternative scartate: review a ogni salvataggio (costo e rumore); solo manuale (si perde il momento giusto, che è il valore del prodotto).
Conseguenze: soglie da tarare con l'uso reale (passo 8 della roadmap). Import ed export sono un buon segnale di cambi architetturali, ma vanno riconosciuti per linguaggio.
