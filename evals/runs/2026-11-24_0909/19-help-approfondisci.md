**Approfondimento · errore di confine**

**Cos'è.** Un errore di confine nasce quando una condizione sbaglia proprio sul valore limite, cioè sul caso "esattamente uguale". Il codice funziona per i valori sopra e sotto, ma tratta male quello preciso. Spesso la causa è la scelta tra un confronto stretto e uno non stretto, oppure un indice che parte o finisce un passo troppo presto. È subdolo perché i casi "comodi" passano e il bug compare solo con i numeri tondi.

**Abitudine.** Per ogni condizione chiediti: "cosa deve succedere quando i due valori sono uguali?". Scrivi la risposta a parole prima di scegliere l'operatore. Poi testa sempre tre valori: subito sotto, esattamente sul limite, subito sopra.

**Esercizio.** Un negozio applica uno sconto "dai 50 € in su". Lavora in centesimi. Prima di scrivere la condizione, decidi a mano l'esito per 4.999, 5.000 e 5.001 centesimi, e scrivi un test per ciascuno. Poi scrivi la condizione e controlla quale test cadrebbe con l'altro operatore.
