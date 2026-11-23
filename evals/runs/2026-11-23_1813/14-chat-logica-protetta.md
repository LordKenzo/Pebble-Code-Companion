La funzione dei dischi è logica del progetto, e proprio la parte che in palestra può far male, quindi il codice lo scrivi tu. Ti do la firma pronta e un esempio su un caso analogo.

**Firma (zona B)**, in un file tipo `src/core/dischi.ts`:

```ts
export type Grammi = number;

export type Scomposizione =
  | { esito: "ok"; target: Grammi; caricoReale: Grammi; perLato: Grammi[] }
  | { esito: "solo-bilanciere"; target: Grammi; caricoReale: Grammi; avviso: string }
  | { esito: "non-valido"; errore: string };

export type DischiPerLato = (
  target: Grammi,
  bilanciere: Grammi,
  dischi: readonly Grammi[],
) => Scomposizione;
```

Bilanciere e dischi entrano come parametri invece di stare scritti nella funzione. È il principio di **iniezione delle dipendenze**: nei test puoi passare un set di dischi ridotto e controllare i casi strani (`ADR-001`). Gli esiti sono una union di stringhe, non un `enum` (`ADR-004`, `ADR-005`).

**Esempio analogo: dare il resto in monete.** Devi restituire 3,80 € e hai monete da 2 €, 1 €, 50 c, 20 c e 10 c.
1. Lavori in centesimi: 380.
2. Parti dalla moneta più grande e ne prendi quante ne entrano: una da 2 €, ti restano 180.
3. Passi alla moneta successiva e ripeti: una da 1 €, poi una da 50 c, poi una da 20 c, poi una da 10 c.
4. Se alla fine resta qualcosa che nessuna moneta copre, quello è lo scarto.

Questo schema si chiama **algoritmo goloso** (*greedy*): a ogni passo prendi il pezzo più grande possibile. Con i tuoi dischi funziona perché ogni taglio è componibile con quelli più piccoli. Nel tuo caso ci sono due passi in più prima di partire, e ricavarli è il punto in cui si impara.

**Checklist per passare la mia review:**
- Solo interi in grammi. Nessun `/ 1000` dentro il core (`ADR-003`).
- Il carico reale non supera mai il target (`ADR-003`).
- Sotto il peso del bilanciere l'esito è `solo-bilanciere`, mai una lista di dischi vuota o negativa (`ADR-004`).
- Un target ≤ 0 dà `non-valido`, senza lanciare eccezioni (`ADR-004`).
- Nessun `console` e nessun `process` nel file (`ADR-001`).
- I dischi per lato escono in ordine decrescente, che è l'ordine di montaggio sul bilanciere (`buona pratica`).

Quando chiedi i test per questo file, il primo caso da cui partire è "con un target di 21 kg restituisce 20 kg e nessun disco".
