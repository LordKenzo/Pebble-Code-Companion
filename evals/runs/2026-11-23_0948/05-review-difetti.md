Il file mescola I/O e regole: va spezzato tra domain e infra prima di aggiungere altro.

> **[errore] righe 1-3, 7-12 · ADR-002**  
> Problema: domain importa `pg`, interroga il DB e lancia `Error('full')` per un esito previsto.  
> Perché: il dominio deve restare puro e testabile senza Postgres. "Corso pieno" è un risultato, non un'eccezione.  
> Prova: in domain una funzione che riceve corso e conteggio prenotazioni e restituisce un esito (prenotato, pieno/in attesa). Le query vanno nell'adapter in `infra/`, il caso d'uso le orchestra.

> **[errore] righe 8-12 · bootstrap › Vincoli (picchi lunedì 7:00), ADR-003**  
> Problema: leggi `booked`, controlli e poi inserisci senza transazione né lock. Inoltre `booked` non viene mai incrementato.  
> Perché: con molte richieste simultanee due iscritti leggono lo stesso posto libero e il corso va oltre la capienza.  
> Prova: lettura e scrittura nella stessa transazione, gestita dall'adapter tramite l'interfaccia definita in domain (ADR-003). Il controllo va fatto su un dato bloccato o con un aggiornamento condizionato.

> **[errore] riga 16 · ADR-002**  
> Problema: `canCancel` legge `Date.now()`.  
> Perché: il dominio non legge l'orologio. Inoltre la regola delle 12 ore diventa difficile da testare proprio al limite.  
> Prova: passa `now` come parametro. L'orologio sta in `infra/` e lo inietta il caso d'uso.

Proposta: **ADR-004: strategia di concorrenza sulla capienza** (lock di riga oppure update condizionato). Serve perché il picco del lunedì la rende una scelta strutturale.

Domanda: quando il corso è pieno, la richiesta deve mettere l'iscritto in lista d'attesa automaticamente, o restituire "pieno" e lasciargli la scelta?
