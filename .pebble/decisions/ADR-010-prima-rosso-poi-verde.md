## ADR-010: Un test conta di più se Pebble l'ha visto fallire prima di passare
Stato: proposto
Contesto: un test verde non prova che il codice sia corretto. Con un test che non controlla niente (`assert.ok(true)` chiamato "60 kg") il compito si spunterebbe lo stesso. La casella darebbe una falsa sicurezza, e in uno strumento didattico è il danno peggiore.
Decisione: per ogni test citato in `fatto quando:`, Pebble ricorda se l'ha mai visto rosso, in uno stato locale ignorato da git (ADR-002).
- **Rosso e poi verde**: la condizione vale piena.
- **Verde senza mai essere stato rosso**: il compito si spunta comunque, ma con un avviso: "verde, ma non l'ho mai visto fallire". Il consiglio è di rompere il codice un momento per vedere il test diventare rosso.
- **Con `pebble.path.requireRedFirst`** (disattivato per default) l'avviso diventa un blocco: il compito resta aperto finché il test non è stato visto fallire.
- **Le parole sono oneste**: una casella spuntata vuol dire "i tuoi test passano", non "il codice è corretto".
In più, la review finale del compito ("Rileggi con Pebble") controlla anche i test: se ciascuno verifica quello che il suo nome promette, e quale caso manca.
Alternative scartate: copertura del codice (dice cosa è stato eseguito, non cosa è stato verificato); mutation testing (costoso, e troppo per chi impara); bloccare sempre (punisce chi scrive il test dopo il codice, che è un modo legittimo di imparare).
Conseguenze: `core/path` riceve anche la cronologia dei test (visto rosso sì o no) e la usa in `evaluate`. Lo stato locale va perso se cambi computer: l'avviso torna finché il test non fallisce di nuovo. Va bene così, perché è un aiuto e non una regola.
