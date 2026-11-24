**Approfondimento · errore di confine**

**Cos'è.** Un errore di confine nasce quando una condizione sbaglia proprio sul valore limite. Nei valori "in mezzo" il codice funziona, ma quando il dato è *uguale* alla soglia sceglie la strada sbagliata. Di solito la causa è un confronto stretto al posto di uno non stretto, o il contrario: `<` contro `<=`, `>` contro `>=`. Nei test passa tutto finché nessuno prova il valore esatto.

**Abitudine.** Per ogni condizione con una soglia chiediti: "che cosa deve succedere quando il valore è *esattamente* uguale alla soglia?". Poi scrivi un test proprio per quel caso, oltre a quelli con un valore appena sotto e appena sopra.

**Esercizio.** Un distributore dà il resto con monete da 50, 20 e 10 centesimi, partendo dalla più grande. Il resto da dare è 70 centesimi. Segui a mano il ciclo due volte: la prima con la regola "prendo la moneta finché il resto è maggiore della moneta", la seconda con "finché è maggiore o uguale". Confronta le monete che ottieni nei due casi.
