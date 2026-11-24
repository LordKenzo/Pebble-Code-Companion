La funzione dei dischi la scrivi tu, anche se è solo un esempio: è logica del dominio (zona C). Ti do però la firma e lo stesso algoritmo applicato a un caso diverso, che si traduce quasi uno a uno.

**Gradino 3 · Esempio analogo**

**Firma proposta** (ADR-001: funzione pura nel `core`; ADR-003: grammi interi):

```ts
export type Grammi = number;
export declare const DISCHI_DISPONIBILI: readonly Grammi[];
export declare function dischiPerLato(caricoPerLato: Grammi, dischi: readonly Grammi[]): Grammi[];
```

Passare `dischi` come parametro invece di leggerlo dentro la funzione la rende testabile anche con inventari inventati. Il principio è la *dependency injection* in piccolo.

**Il caso analogo: il resto alla cassa.** Devi dare 3,80 € con monete da 2 €, 1 €, 50 c, 20 c e 10 c. Prima converti tutto in centesimi (380), così niente decimali. Poi:

1. parti dalla moneta più grande;
2. finché il resto è almeno quanto quella moneta, la aggiungi alla lista e la sottrai dal resto;
3. quando non ci sta più, passi alla moneta successiva;
4. alla fine il resto dovrebbe essere zero.

Risultato: 2 €, 1 €, 50 c, 20 c, 10 c.

Per i tuoi dischi la struttura è la stessa. Cambiano tre cose: le monete diventano dischi, i centesimi diventano grammi e l'importo diventa il carico **per lato**, cioè quello che resta tolto il bilanciere, diviso due.

**Concetto:** algoritmo greedy (goloso). Funziona qui perché ogni disco è un multiplo di 1,25 kg. Per approfondire, cerca "greedy algorithm coin change" e il caso in cui l'algoritmo *non* dà la soluzione migliore.

**Checklist per passare la mia review**

- Lavora solo in grammi interi, mai kg float (ADR-003).
- Non usa `console` né `process` (ADR-001).
- Non modifica l'array `dischi` ricevuto: se lo ordini, lavori su una copia.
- Non decide da sola il caso "sotto i 20 kg". Quello è un esito con avviso (ADR-004) e va gestito prima di chiamarla.
- Restituisce i dischi dal più pesante al più leggero, nell'ordine in cui li carichi.
- Ha almeno questi test con `node:test` (ADR-005):
  - "60 kg: un 20 per lato";
  - "20 kg: nessun disco";
  - "142,5 kg: 25 + 20 + 15 + 1,25 per lato";
  - un carico per lato che non è multiplo di 1250 g.

Prima di scriverla, pensa a questo: se alla fine il resto **non** arriva a zero, cosa deve restituire la funzione, visto che per ADR-004 il core non lancia eccezioni?
