Il file mescola I/O e regole di dominio, e la verifica della capienza non regge ai picchi del lunedì.

```
[errore] riga 1-3, 7-12 · ADR-002
Problema: domain/ importa `pg`, crea un Pool e scrive SQL. Il caso "corso pieno" è un'eccezione generica (`throw new Error('full')`).
Perché: ADR-002 vuole un dominio puro, senza I/O e con gli esiti previsti come valori di ritorno. Così com'è, la regola non si testa senza un database. Inoltre chi chiama non distingue "pieno" da un errore vero, e dovrà farlo per mandare l'iscritto in lista d'attesa.
Prova: dividi in tre pezzi. In domain/ una funzione pura che riceve lo stato del corso e restituisce un esito discriminato (prenotato, in lista d'attesa, corso inesistente). In application/ il caso d'uso "prenota", che orchestra. In infra/ l'SQL, dietro un'interfaccia definita in domain (ADR-003).

[errore] riga 16 · ADR-002
Problema: `canCancel` legge `Date.now()`.
Perché: ADR-002 vieta di leggere l'orologio nel dominio. La regola delle 12 ore (bootstrap › Vincoli) è il caso più delicato da testare, soprattutto al confine esatto delle 12:00:00, e con l'orologio di sistema non lo puoi fissare.
Prova: passa "adesso" come parametro. Per esempio la firma `canCancel(startsAt: Date, now: Date): boolean`. L'orologio vero sta in infra/ e lo inietta application/.

[avviso] riga 7-12 · bootstrap › Vincoli, ADR-003
Problema: leggi la capienza, controlli e poi inserisci, in due query separate e senza transazione. `course` può anche essere `undefined` se l'id non esiste.
Perché: lunedì alle 7:00 molte richieste concorrenti leggono lo stesso `booked` e passano tutte il controllo. Il risultato è overbooking proprio nel momento critico.
Prova: rendi atomica l'operazione nell'adapter. Due strade possibili: un lock sulla riga del corso dentro una transazione, oppure un vincolo o un aggiornamento condizionale che fallisce se la capienza è superata. Il dominio decide l'esito, l'adapter garantisce che lo stato letto sia ancora valido quando scrive.
```

ADR proposto: **ADR-004: Strategia di concorrenza sulle prenotazioni**. Serve per decidere tra lock pessimistico e aggiornamento condizionale prima di scrivere l'adapter, perché la scelta cambia l'interfaccia di transazione prevista da ADR-003.

Domanda: quando qualcuno cancella, il primo in lista d'attesa va promosso automaticamente o deve confermare? Da questo dipende se la cancellazione è un caso d'uso che tocca due prenotazioni nella stessa transazione.
