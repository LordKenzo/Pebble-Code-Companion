**Approfondimento · aritmetica in virgola mobile**

**Cos'è.** Il computer salva i numeri con la virgola (*float*) in binario, e molti decimali come 0,7 o 0,1 non si possono scrivere esatti: resta un errore minuscolo. Di solito non si vede. Diventa grave quando poi tagli il numero con `Math.floor`, che arrotonda per difetto: 122,4999… diventa 120, non 122,5. Per questo ADR-003 chiede di lavorare in grammi interi.

**L'abitudine.** Fai i conti in unità intere (grammi, centesimi) e converti in kg solo quando stampi. Prima di ogni `Math.floor`, chiediti: "questo numero può essere un *quasi* intero?"

**Esercizio.** Apri il terminale, scrivi `node` e prova:
1. `1.15 * 100`, che cosa stampa?
2. `Math.floor(1.15 * 100)`: ti aspetti 115. Che cosa ottieni?
3. Rifai il conto partendo da 115 centesimi interi. Cambia qualcosa?
