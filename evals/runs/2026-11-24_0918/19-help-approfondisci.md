**Approfondimento · condizioni al limite (confronto stretto o largo)**

**Cos'è.** Molti bug nascono proprio sul valore di confine: quando la quantità da confrontare è *esattamente uguale* alla soglia. Scegliere tra «maggiore» e «maggiore o uguale» decide se quel caso rientra o resta fuori. È parente stretto dell'errore off-by-one: il codice funziona su quasi tutti i valori e sbaglia solo dove i due numeri coincidono.

**Abitudine.** Per ogni confronto chiediti a voce: «e se fossero uguali, cosa deve succedere?». Poi scrivi un test con il valore esattamente sulla soglia, oltre a uno sotto e uno sopra.

**Esercizio.** Una funzione dà il resto in monete (200, 100, 50, 20, 10 centesimi), partendo dalla più grande. Calcola a mano il resto di 300 centesimi e quello di 10 centesimi. In quale dei due casi è decisivo come confronti il resto con la moneta? Scrivi il test che lo dimostra.
