Il file va bene: rispetta ADR-002 (`now` arriva da fuori, gli esiti sono valori di ritorno) e a 12 ore esatte la cancellazione è gratuita, come chiede il bootstrap.

> **[info] riga 10 · bootstrap › Vincoli**  
> Problema: `booking` è un parametro non usato.  
> Perché: chi chiama si aspetta che lo stato della prenotazione conti. Con la lista d'attesa, chi è in coda e cancella dopo il limite oggi risulterebbe `late`.  
> Prova: se lo stato incide sull'esito, usalo e aggiungi un test per quel caso; altrimenti toglilo dalla firma, insieme all'import di `Booking`.

Chi è in lista d'attesa deve poter uscire gratis anche nelle ultime 12 ore?
