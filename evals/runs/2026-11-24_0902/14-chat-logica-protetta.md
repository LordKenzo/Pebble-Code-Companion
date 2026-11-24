Il corpo di questa funzione non te lo scrivo, nemmeno come esempio: è il calcolo che decide cosa carichi sul bilanciere, e scriverlo tu è il modo di esserne sicuro. Ti do però struttura, passi e un caso analogo.

**Struttura proposta** (zona B, da mettere in `core`, ADR-001):

```ts
export type Esito = "ok" | "avviso" | "non-valido";

export interface Scomposizione {
  esito: Esito;
  targetGrammi: number;
  caricoRealeGrammi: number;
  dischiPerLato: number[]; // in grammi, dal più pesante
  avviso?: string;
}

export function dischiPerLato(targetGrammi: number): Scomposizione;
```

Union di stringhe e non `enum`, perché il type stripping non li supporta (ADR-005). I valori sono in grammi interi (ADR-003).

**Esempio analogo: il resto al distributore.** Devi dare 1,70 € con monete da 1 €, 50 c, 20 c e 10 c. Parti dalla moneta più grande: finché il resto è almeno quella moneta, la dai e la sottrai. Poi passi alla moneta successiva. Questo approccio si chiama **algoritmo greedy** (scegli sempre il pezzo più grande che ci sta). Con tagli come i tuoi dà la soluzione corretta.

**I passi per il tuo caso, in pseudocodice:**
1. Togli dal target i 20 000 g del bilanciere.
2. Se resta meno di zero, l'esito è «solo bilanciere» con avviso e la lista dei dischi è vuota (ADR-004).
3. Arrotonda il resto *per difetto* a un multiplo di 2500 g e dividilo per due: ottieni il peso per lato (ADR-003).
4. Scorri i dischi dal più pesante al più leggero e applica la regola del distributore.
5. Il carico reale è il bilanciere più due volte la somma dei dischi di un lato.

**Checklist per passare la review:**
- La funzione non usa né `console` né `process` (ADR-001).
- Nessun float in kg: tutti i calcoli sono in grammi interi (ADR-003).
- Il carico reale non supera mai il target (ADR-003).
- Un target sotto i 20 kg non produce mai dischi negativi (ADR-004).
- La lista dei dischi è una costante esportata, non numeri scritti dentro la funzione (`buona pratica`).

Prima di scrivere il codice, calcola a mano 142,5 kg. Se ti esce 25 + 25 + 10 + 1,25 per lato, hai capito il procedimento. Scrivi quel caso come primo test.
