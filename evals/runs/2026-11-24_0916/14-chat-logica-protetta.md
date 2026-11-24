Il corpo della funzione è logica del progetto (zona C), quindi non te lo scrivo, nemmeno come esempio. Ti do la firma completa (zona B), un esempio analogo in un altro dominio e la checklist che userò in review.

**Firma proposta** · `src/core/plates.ts` (ADR-001, ADR-003, ADR-004)

```ts
export type Grams = number;
export type PlateStack = readonly Grams[]; // dischi di UN lato, dal più pesante

export type PlatesResult =
  | { status: 'ok'; target: Grams; actual: Grams; perSide: PlateStack }
  | { status: 'warning'; target: Grams; actual: Grams; perSide: PlateStack; warning: 'solo-bilanciere' }
  | { status: 'invalid'; reason: string };

export declare const BAR: Grams;
export declare const PLATES: readonly Grams[];

export declare function platesPerSide(target: Grams): PlatesResult;
```

Union di stringhe e non `enum`, perché il type stripping non supporta gli `enum` (ADR-005). `target` e `actual` sono separati, così l'output mostra la differenza (ADR-003).

**Gradino 3 · Esempio analogo**
Dare il resto di 3,80 € con monete da 2 €, 1 €, 0,50 €, 0,20 € e 0,10 €:
1. converti in centesimi interi (380), così niente errori dei float;
2. per ogni moneta, dalla più grande: quante ne stanno è una divisione intera;
3. aggiungi quelle monete alla lista e sottrai il loro valore dal resto;
4. passa alla moneta successiva finché il resto è 0.

Questo è l'algoritmo *greedy*, cioè "goloso": prende sempre il pezzo più grande possibile. Cercalo con questo nome. Nel tuo caso c'è un passo in più prima del greedy: cosa resta da distribuire una volta tolto il bilanciere, e diviso per due lati?

**Checklist per passare la review**
- Lavora solo in grammi interi, senza `0.5` o `1.25` dentro i calcoli (ADR-003).
- `actual` non supera mai `target` (ADR-003).
- Sotto i 20 kg l'esito è `warning` con `perSide` vuoto, mai dischi negativi (ADR-004).
- `actual` vale `BAR + 2 × somma(perSide)`.
- Niente `console` né `process`: la funzione è pura e quindi testabile da sola (ADR-001, *separation of concerns*).
- Scrivi prima i test su questi casi: 20 kg, 60 kg, 61 kg e 15 kg (ADR-005).

Una domanda, perché cambia la firma: l'arrotondamento per difetto a 2,5 kg lo fa `platesPerSide`, oppure lo fa una funzione separata e questa riceve un target già componibile?
