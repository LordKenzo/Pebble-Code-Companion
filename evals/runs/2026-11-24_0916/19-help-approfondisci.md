**Approfondimento · Condizioni al confine (errore off-by-one nei confronti)**

**Cos'è.** Quando un confronto decide se un'azione avviene, il caso critico è il valore *esattamente uguale* al limite. Scegliere tra `>` e `>=` (o tra `<` e `<=`) decide se quel valore sta dentro o fuori. Sbagliarlo non rompe i casi "comodi", solo quelli sul bordo. Per questo i test con valori lontani dal limite passano lo stesso.

**L'abitudine.** Per ogni confronto chiediti: "e se i due valori sono uguali, cosa deve succedere?". Poi scrivi un test proprio con quel valore. Il caso limite va trattato come un requisito, non come un dettaglio.

**Esercizio.** Un cinema fa il biglietto ridotto "fino a 12 anni compresi". Scrivi a mano la tabella di 11, 12 e 13 anni con l'esito atteso. Poi scrivi la condizione e verifica riga per riga se il dodicenne paga il ridotto. Prova sia con `<` sia con `<=` e confronta i risultati.
