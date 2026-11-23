Il file rispetta ADR-002: è puro, riceve `now` dall'esterno e restituisce gli esiti come valori. Ci sono solo due punti.

```
[avviso] riga 10 · bootstrap › Vincoli
Problema: il parametro `booking` è nella firma ma non viene mai letto.
Perché: con la lista d'attesa ci sono prenotazioni confermate e iscrizioni in attesa. Uscire dalla lista d'attesa a 2 ore dall'inizio non dovrebbe risultare `late`. Una prenotazione già cancellata non dovrebbe produrre nessun esito di cancellazione. Oggi la funzione tratta tutto allo stesso modo.
Prova: decidi se lo stato della prenotazione fa parte di questa regola. Se sì, controllalo prima del calcolo delle ore e aggiungi a `CancelOutcome` gli esiti che mancano (per esempio "in attesa" e "già cancellata"). Se no, togli `booking` dalla firma, così chi chiama non pensa che venga controllato.
```

```
[info] riga 11 · generale
Problema: `startsAt` arriva come parametro separato da `booking`.
Perché: niente garantisce che sia l'orario del corso a cui appartiene quella prenotazione. Il chiamante in application/ può passare la data sbagliata e il dominio non se ne accorge.
Prova: se `Booking` contiene già, o può contenere, l'orario della lezione, leggilo da lì. Altrimenti passa un tipo che tenga insieme prenotazione e lezione.
```

Domanda: "fino a 12 ore prima" vuol dire che a 12 ore esatte la cancellazione è ancora gratuita? Oggi la riga 13 risponde di sì. Confermalo con chi gestisce lo studio e fissalo in un test sul caso limite.
