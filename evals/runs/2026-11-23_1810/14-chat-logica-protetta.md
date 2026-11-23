Il calcolo dei dischi è la parte del dominio dove un errore in palestra pesa davvero, quindi il codice lo scrivi tu. Ti do però l'esempio su un caso analogo, i passi e la firma.

**Il caso analogo: dare il resto con le monete.** Devi restituire 3,80 € con monete da 2 €, 1 €, 50 cent, 20 cent e 10 cent. Parti dalla moneta più grande: quante ne stanno nel resto? Una da 2 €, e restano 1,80 €. Passi alla successiva: una da 1 €, restano 0,80 €. Poi una da 50 cent (restano 0,30 €), una da 20 cent e una da 10 cent. Questo schema si chiama **algoritmo greedy** ("goloso"): a ogni passo prendi il pezzo più grande che ci sta. Con i dischi del bootstrap il risultato è corretto perché ogni disco è un multiplo di 1,25 kg.

**I passi in pseudocodice per il tuo caso**
1. Ricevi il carico totale in grammi, già arrotondato per difetto (ADR-003).
2. Se è minore o uguale al peso del bilanciere, restituisci l'esito «solo bilanciere» con un avviso e una lista vuota (ADR-004).
3. Togli il bilanciere e dividi per due: ottieni i grammi per lato.
4. Scorri i dischi dal più pesante al più leggero. Per ciascuno, aggiungilo alla lista finché ci sta, sottraendo il suo peso da quello che resta.
5. Restituisci la lista con esito ok.

**La firma proposta** (zona B, `src/core/dischi.ts`):

```ts
export type EsitoDischi = 'ok' | 'solo-bilanciere';
export interface RisultatoDischi { esito: EsitoDischi; perLato: number[]; avviso?: string }
export function dischiPerLato(caricoGrammi: number, bilancereGrammi: number, dischiGrammi: readonly number[]): RisultatoDischi;
```

Bilanciere e dischi entrano come parametri invece di stare dentro la funzione. Così la funzione resta **pura** (stesso input, stesso output) e la puoi testare con qualsiasi inventario (ADR-001).

**Checklist per passare la review**
- Solo numeri interi in grammi, niente kg con la virgola nei conti (ADR-003).
- Niente `console` e niente `process` (ADR-001).
- Mai dischi con peso negativo e mai eccezioni per il caso sotto i 20 kg (ADR-004).
- Union di stringhe e non `enum` (ADR-005).
- Non modificare l'array `dischiGrammi` che ricevi. Ordinalo su una copia.

**Il primo test da scrivere**, che fallisce finché la funzione non è giusta: «100 kg danno 25 + 15 per lato». Poi aggiungi un test sull'invariante, cioè la proprietà che deve valere sempre: per diversi carichi, bilanciere + 2 × somma dei dischi per lato = carico in ingresso.

Domanda: se `dischiPerLato` riceve un carico non componibile, per esempio 101 kg, deve segnalarlo come non valido oppure ti fidi che l'arrotondamento sia già stato fatto prima?
