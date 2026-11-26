Il file rispetta ADR-001 e ADR-002: `domain/` non importa librerie di I/O, non legge l'orologio (riceve `now`) e restituisce esiti come valori. La soglia di 12 ore è corretta: `>= 12` è gratuita, quindi cancellare esattamente 12 ore prima è ancora gratuito, come dice il bootstrap.

> **[info] riga 8 · ADR-002**
> Problema: il parametro `booking` non viene usato nel corpo della funzione.
> Perché: un parametro inutile confonde chi legge e può nascondere una regola dimenticata.
> Prova: se la regola non dipende dalla prenotazione, togli il parametro. Se ti serve più avanti (ad esempio per una regola diversa per tipo di corso), lascialo e aggiungi un commento che dice a cosa serve.

Domanda: la politica di cancellazione cambierà in base al tipo di corso o allo status dell'iscritto? Da questo dipende se `booking` deve restare nella firma.
