Il corpo della funzione è la logica del progetto e te lo lascio scrivere, anche come esempio. Visto che chiedi un esempio, salgo direttamente a firma, passi in pseudocodice e checklist.

**Firma proposta** (zona B, da ADR-003 e ADR-004)

```ts
// src/core/dischi.ts
export type Grammi = number; // sempre interi (ADR-003)

export type Esito = "ok" | "ok-con-avviso" | "non-valido"; // union, niente enum (ADR-005)

export interface DischiPerLato {
  esito: Esito;
  caricoGrammi: Grammi;   // carico totale già arrotondato
  perLato: Grammi[];      // es. [20000, 2500] = un 20 e un 2,5 per lato
  avviso?: string;
}

export const BILANCIERE_G: Grammi = 20000;
export const DISCHI_G: readonly Grammi[] = [25000, 20000, 15000, 10000, 5000, 2500, 1250];

export function dischiPerLato(caricoGrammi: Grammi): DischiPerLato;
```

L'arrotondamento per difetto (ADR-003) mettilo in una funzione separata, chiamata prima di questa. Così ognuna fa una cosa sola (*single responsibility*) e la testi da sola.

**Passi per il tuo caso** (pseudocodice)

1. Se il carico è sotto `BILANCIERE_G`, restituisci "solo bilanciere": esito con avviso e lista dischi vuota (ADR-004). Mai dischi negativi.
2. Togli il peso del bilanciere e dividi a metà. È quello che va su ogni lato.
3. Scorri `DISCHI_G` dal più pesante al più leggero. Per ogni disco conta quante volte ci sta nel resto, aggiungilo alla lista altrettante volte e scala il resto.
4. Alla fine il resto deve essere zero. Se non lo è, l'arrotondamento a monte ha un bug: segnalalo come esito, non ignorarlo.

**Checklist per passare la review**
- Nessun float in kg dentro la funzione. Tutto in grammi interi (ADR-003).
- Nessun `console` o `process` nel core (ADR-001).
- La lista per lato è ordinata dal disco più pesante.
- Tre casi coperti da test, scritti in parole:
  - "60 kg: un 20 per lato"
  - "20 kg: solo bilanciere, nessun disco"
  - "15 kg: solo bilanciere, con avviso"
- Un test con un carico che usa il disco da 1,25, per esempio "22,5 kg: un 1,25 per lato".

**Concetto:** algoritmo greedy, cioè scegliere a ogni passo il pezzo più grande che ci sta. Con dischi illimitati (ADR-004) dà il numero minimo di dischi. Cercalo come "coin change greedy".

Ti conviene partire dal test "60 kg: un 20 per lato", poi scrivere il corpo seguendo i passi.
