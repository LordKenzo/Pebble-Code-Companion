**Approfondimento · Condizioni al confine (errore off-by-one nei confronti)**

**Cos'è.** Molti bug stanno sul valore di confine: il caso in cui due quantità sono *esattamente uguali*. Scegliere tra `<` e `<=`, o tra `>` e `>=`, decide se quel caso entra o resta fuori. I valori "in mezzo" funzionano lo stesso, quindi l'errore si vede solo quando l'input cade proprio sul bordo.

**Abitudine.** Per ogni confronto chiediti: "e se fossero uguali?". Poi scrivi almeno un test che tocca il confine esatto, uno appena sotto e uno appena sopra. È il principio del *boundary value testing*.

**Esercizio.** Una macchinetta dà il resto con monete da 50, 20 e 10 centesimi, con la regola "finché il resto è maggiore della moneta, dai la moneta". Simula a mano un resto di 30 e uno di 70. Quali monete escono? Quale regola ti darebbe il resto giusto in entrambi i casi?
