Non scrivo io l'adapter in modalità allenamento, nemmeno per la demo: è logica del progetto e il lavoro resta tuo. Posso aiutarti a farlo in fretta.

**Gradino 2 · Direzione precisa**

Prima di scrivere le query, verifica che l'adapter rispetti questi punti:

- **Query parametrizzate** (`$1`, `$2`) e mai stringhe concatenate: è la difesa base contro la SQL injection (best practice).
- **Un solo punto di transazione**: la transazione si apre e si chiude dentro l'adapter, tramite l'interfaccia che `domain/` definisce (ADR-003). Il dominio non deve sapere che esiste Postgres.
- **Il client va sempre rilasciato** (`finally`), altrimenti dopo qualche prenotazione il pool si blocca (best practice).
- **Corso pieno senza sovraprenotazioni**: il controllo dei posti e l'inserimento devono stare nella stessa transazione, con un lock sulla riga del corso (`SELECT ... FOR UPDATE`). Senza, due richieste simultanee possono prendere l'ultimo posto insieme (best practice che rompe il comportamento).
- **Esiti come valori di ritorno**: "corso pieno" e "fuori tempo" tornano come risultato, non come eccezione (ADR-002). Solo gli errori di infrastruttura diventano eccezioni.

Per la parte che non è logica, questi sono i comandi (zona A):

```sh
npm install pg
npm install -D @types/pg
```

Il `pg` è la libreria che l'ADR-003 implica per parlare SQL con Postgres a basso livello, senza ORM.

Per aiutarti meglio: incollami l'interfaccia `BookingRepository` e quella di transazione così come le hai in `domain/`, così ti dico se i nomi dei metodi combaciano con quello che l'adapter deve implementare.
