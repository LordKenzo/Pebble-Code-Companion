**Deep dive · Condizione di confine (errore off-by-one)**

**Cos'è.** Un errore off-by-one nasce quando un confronto o un intervallo sbaglia di "uno" proprio sul valore limite. Il caso tipico è un confronto stretto dove serviva quello largo, o viceversa. Il codice funziona su quasi tutti i valori e fallisce solo quando due numeri sono esattamente uguali. Per questo sfugge ai test "medi".

**Abitudine.** Per ogni confronto chiediti: "e se i due valori sono identici?". Poi scrivi un test proprio su quel valore uguale, oltre a quelli sopra e sotto. È il principio dei *boundary value tests*: i bug si concentrano sui bordi.

**Esercizio.** Immagina un distributore che dà resto solo in monete da 50 centesimi. Il ciclo è "finché il resto è maggiore di 50, dai una moneta". Segui a mano il resto di 1,00 € e poi quello di 0,50 €. Scrivi le due righe di test che ti aspetti, e poi controlla quante monete escono davvero.
