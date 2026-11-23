La funzione dei dischi è logica del progetto: deve essere tua. Sbagliarla in palestra vuol dire caricare male il bilanciere. Ti do la firma, un esempio su un problema analogo e la checklist che userò in review.

**Firma consigliata** (in `core`, ADR-001; grammi interi, ADR-003)

```ts
// Riceve un carico già arrotondato per difetto e ≥ peso del bilanciere.
// Restituisce i dischi di UN lato, dal più pesante al più leggero, in grammi.
export function dischiPerLato(
  caricoTotaleG: number,
  bilanciereG: number,
  dischiDisponibiliG: readonly number[],
): readonly number[];
```

Questa funzione fa una cosa sola (separazione delle responsabilità). L'arrotondamento e il caso «solo bilanciere» li gestisce chi la chiama, che costruisce il risultato con l'esito (ADR-004). Così puoi testarla da sola.

**Esempio analogo: dare il resto in monete**

Devi restituire 3,70 € con monete da 2 €, 1 €, 50, 20 e 10 centesimi.
1. Converti tutto in centesimi interi: 370. Niente decimali.
2. Prendi la moneta più grande. Finché ci sta nel resto, la aggiungi alla lista e la sottrai.
3. Quando non ci sta più, passi alla moneta successiva.
4. Alla fine il resto deve essere 0. Se non lo è, l'importo di partenza non era componibile.

Risultato: 2 €, 1 €, 50 c, 20 c. Questo metodo si chiama algoritmo greedy («goloso»): a ogni passo prende la scelta più grande possibile. Con le tue taglie di dischi funziona, perché 1,25 kg divide tutte le altre. Prima di applicarlo, nel tuo caso c'è un passaggio in più, che sta a te individuare.

**Checklist per passare la review**
- Solo grammi interi, mai kg float (ADR-003).
- Nessun `console` e nessun `process` (ADR-001).
- I dischi sono illimitati per taglio, quindi niente contatori di inventario (ADR-004).
- Il resto finale è sempre 0. Se non lo è, l'errore sta a monte, nell'arrotondamento: non va nascosto.
- Test da scrivere (`node:test`, ADR-005):
  - con 20 kg restituisce una lista vuota;
  - con 22,5 kg restituisce un disco da 1,25;
  - con 60 kg restituisce un disco da 20;
  - con 100 kg restituisce 25 e 15, nell'ordine dal più pesante.

Parti dal test dei 20 kg: è il caso limite più facile da sbagliare.

Quando l'hai scritta, mandamela in REVIEW.
