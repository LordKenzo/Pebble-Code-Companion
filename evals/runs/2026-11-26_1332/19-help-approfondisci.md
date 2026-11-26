**Approfondimento · Condizioni al confine (errore off-by-one nei confronti)**

**Cos'è.** Molti bug si nascondono nel valore esatto di confine. Lì scegliere tra `<` e `<=` decide se il caso "uguale" entra o resta fuori. Gli algoritmi greedy ("prendo il pezzo più grande che ci sta") sono molto sensibili a questo. "Ci sta" include anche "ci sta giusto giusto"?

**L'abitudine.** Per ogni confronto chiediti: *cosa succede quando i due valori sono uguali?* Poi scrivi un test proprio su quel valore, non solo sopra e sotto. È il principio del *boundary value testing*: i casi limite valgono più dei casi medi.

**Esercizio.** Su carta: una funzione dà il resto in monete `[50, 20, 10]` centesimi. Il ciclo è `while (resto > moneta)`. Segui a mano 30, 50 e 70 centesimi. Che monete escono? Quali casi tornano giusti e perché proprio quelli?
