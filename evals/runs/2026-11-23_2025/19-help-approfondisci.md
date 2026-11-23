**Approfondimento · errore di confine (off-by-one nei confronti)**

**Cos'è.** Un errore di confine nasce quando una condizione dà la risposta giusta per quasi tutti i valori ma sbaglia proprio sul valore limite. Spesso la causa è la scelta tra confronto stretto e non stretto: "maggiore di" contro "maggiore o uguale a". I valori lontani dal limite non lo rivelano. Per questo i test "a occhio" passano e il bug resta nascosto.

**Abitudine.** Per ogni confronto che scrivi, chiediti: "cosa deve succedere quando i due valori sono *esattamente uguali*?". Poi scrivi un test proprio su quel valore. È il principio dei test sui valori limite: si testa il bordo, non il centro.

**Esercizio.** Una regola dice: "spedizione gratuita per ordini da 50 € in su". Scrivi a mano la condizione, poi verificala su 49,99, 50,00 e 50,01. Quale dei tre distingue `>` da `>=`? Scrivi quel caso come test con `node:test` (ADR-005), in grammi o centesimi interi (ADR-003).

**Concetto:** errore di confine
