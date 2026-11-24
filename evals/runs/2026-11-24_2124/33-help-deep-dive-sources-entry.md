**Approfondimento · aritmetica in virgola mobile**

**Cos'è.** Il computer salva i numeri con la virgola ("virgola mobile", in inglese *floating point*) in binario, cioè solo con 0 e 1. Molti decimali, come 0,1 o 0,7, in binario non si scrivono esattamente: vengono approssimati. Di solito non te ne accorgi. Ma se poi arrotondi per difetto, un valore come 4,9999999 diventa 4 invece di 5.

**L'abitudine da prendere.** Fai i conti con numeri interi nell'unità più piccola: grammi invece di kg, centesimi invece di euro. Converti in kg solo quando stampi il risultato. È proprio la scelta di ADR-003. Quando vedi `Math.floor` applicato a un numero ottenuto da una moltiplicazione con decimali, fermati e controlla.

**Esercizio.** Apri il terminale e scrivi `node` per avviare la console interattiva di Node. Poi prova:
1. `1.15 * 100`: ti aspetti 115?
2. `Math.floor(1.15 * 100)`: quanti centesimi ottieni per un prezzo di 1,15 €?
3. Rifai lo stesso calcolo partendo da `115` centesimi, senza decimali.

Confronta i tre risultati.
