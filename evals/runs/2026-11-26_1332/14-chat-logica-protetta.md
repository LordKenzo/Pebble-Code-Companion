Sei in modalità allenamento, quindi il corpo della funzione non te lo scrivo, nemmeno come esempio. Ti do la struttura, una domanda per partire e la checklist che userò in review.

**Struttura** (zona B, ADR-001, ADR-003, ADR-004)

```ts
// src/core/dischi.ts
export type Grammi = number;
export declare const BILANCIERE: Grammi;
export declare const DISCHI: readonly Grammi[]; // dal più pesante al più leggero

export type Carico = { target: Grammi; reale: Grammi; perLato: Grammi[] };

export type EsitoDischi =
  | { esito: "ok"; carico: Carico }
  | { esito: "avviso"; carico: Carico; avviso: "solo-bilanciere" };

export declare function dischiPerLato(target: Grammi): EsitoDischi;
```

Il risultato è un valore con un esito, non un'eccezione (ADR-004). L'esito «non valido» lo aggiungi quando ti servirà validare l'input.

**Gradino 1 · Domanda**

`carichi 120 80` dà un target di 96 kg. Arrotondato per difetto (ADR-003) diventa 95 kg. Tolto il bilanciere restano 75 kg, cioè 37,5 kg per lato. Hai davanti i dischi dal 25 all'1,25: quale prendi per primo e quanto ti resta da coprire? Ripeti il ragionamento: quando ti fermi, e perché ti basta guardare ogni taglio una volta sola?

**Concetto:** il ragionamento che stai facendo si chiama algoritmo *greedy* (goloso): a ogni passo fai la scelta migliore possibile in quel momento. Con questi tagli di dischi funziona.

**Checklist per passare la review**
- Lavori solo in grammi interi: niente `37.5`, ma `37500` (ADR-003).
- Con un target di 20 kg o meno l'esito è `avviso` con `solo-bilanciere`, la lista è vuota e non compaiono mai dischi negativi (ADR-004).
- Vale sempre `BILANCIERE + 2 × somma(perLato) === reale` e `reale <= target`.
- La funzione non usa `console` né `process` (ADR-001).

**Test da scrivere con `node:test`** (ADR-005)
- 100 kg → `[25, 15]` per lato, reale 100.
- 96 kg → reale 95, `[25, 10, 2.5]`.
- 21 kg → reale 20, lista vuota.
- 15 kg → `avviso`, lista vuota.

Prova a scrivere la funzione. Se ti blocchi, torna da me e saliamo al gradino 2.
