**Approfondimento · Errori di confine (confronto stretto o non stretto)**

**Il concetto.** Ogni condizione con `<`, `>`, `<=` o `>=` ha un valore di confine: il punto esatto in cui i due lati sono uguali. Il confronto stretto esclude quel valore, quello non stretto lo include. È una delle fonti di bug più comuni perché il codice funziona su quasi tutti gli input e sbaglia solo sul caso «giusto giusto».

**L'abitudine.** Per ogni condizione chiediti: «e se fossero esattamente uguali?». Poi scrivi un test proprio su quel valore. I casi limite vanno testati, non dati per scontati.

**L'esercizio.** Prendi una funzione che dà il resto in monete da 50, 20 e 10 centesimi. Scegli i tagli dal più grande, come fai tu con i dischi. Calcola a mano il resto di 50 centesimi e poi quello di 70, una volta con il confronto stretto e una volta con quello non stretto. Quale delle due versioni restituisce una moneta da 50?
