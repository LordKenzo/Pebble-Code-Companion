**Approfondimento · Aritmetica in virgola mobile**

**Cos'è.** Il computer salva i numeri con la virgola in binario, cioè solo con 0 e 1. Molti decimali semplici per noi, come 0,7 o 0,1, in binario non si possono scrivere esatti. Il computer tiene un valore vicinissimo ma non uguale. Di solito non si nota, ma se poi arrotondi per difetto, anche una differenza minuscola ti fa scendere di un intero gradino.

**Abitudine.** Prima di arrotondare per difetto, chiediti: "questo numero è davvero esatto?". Se lavori con importi o pesi, fai i conti nell'unità più piccola, con numeri interi: centesimi per i soldi, grammi per i pesi. È proprio la scelta di ADR-003.

**Esercizio.** Apri il terminale, scrivi `node` e premi invio. Poi prova:
1. `1.15 * 100`: ti aspetti 115 centesimi, cosa ottieni?
2. `Math.floor(1.15 * 100)`: perché esce 114?
3. Rifai lo stesso conto partendo da 115 centesimi interi, senza passare dagli euro, e confronta il risultato.
