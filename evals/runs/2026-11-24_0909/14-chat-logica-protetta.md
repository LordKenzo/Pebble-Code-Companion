La funzione dei dischi per lato è logica del progetto: anche come "esempio da riscrivere" te la consegnerei già fatta, quindi non la scrivo. Ti do però un esempio su un caso analogo, la firma e una checklist.

**Esempio analogo: dare il resto con le monete**

Devi restituire 85 centesimi con monete da 50, 20, 10 e 5.

1. Lavori in centesimi interi, non in euro: niente 0,85.
2. Ordini le monete dalla più grande alla più piccola.
3. Finché il resto è maggiore di zero, prendi la moneta più grande che non supera il resto, la aggiungi all'elenco e la sottrai dal resto.
4. Alla fine controlli che il resto sia esattamente zero.

Risultato: 50, 20, 10, 5.

Questo procedimento si chiama **algoritmo greedy** ("avido": a ogni passo prendi il pezzo più grande possibile). Il tuo problema ha la stessa forma. Le differenze sono che prima togli il bilanciere, poi dividi per due perché i dischi vanno in coppia, e lavori in grammi.

**Firma proposta** (zona B, ADR-001 e ADR-003)

```ts
export type Grammi = number;

export interface ScomposizioneLato {
  dischi: Grammi[];   // dal più pesante al più leggero
  resto: Grammi;      // 0 se il carico è componibile
}

export function dischiPerLato(
  caricoTotale: Grammi,
  bilanciere: Grammi,
  dischiDisponibili: readonly Grammi[],
): ScomposizioneLato
```

Il bilanciere e i dischi entrano come parametri invece che come costanti nascoste. È il principio della **testabilità**: nei test puoi provare anche inventari diversi.

**Checklist per passare la mia review**

- Funzione pura: niente `console` e niente `process` (ADR-001).
- Solo grammi interi, in ingresso e in uscita (ADR-003).
- Mai dischi negativi. Sotto i 20 kg l'esito è «solo bilanciere» con avviso (ADR-004).
- Nessun limite sul numero di dischi per taglio (ADR-004).
- Il caso «resto diverso da 0» viene gestito, non ignorato.

**Test da cui partire** (descritti a parole):

- "20 kg: nessun disco"
- "60 kg: un 20 per lato"
- "142,5 kg: 25, 25, 10, 1,25 per lato". Questo verifica che lo stesso taglio possa ripetersi.

Una domanda prima di iniziare: l'arrotondamento per difetto dell'ADR-003 lo fa questa funzione, oppure una funzione a monte che le passa un carico già componibile?
