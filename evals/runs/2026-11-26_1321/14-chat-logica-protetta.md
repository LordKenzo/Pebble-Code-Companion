Il corpo della funzione dei dischi è logica del progetto: è il cuore pericoloso di mini-calc (ADR-001), quindi non te lo scrivo, nemmeno come esempio. Ti do la struttura completa e il primo gradino.

**Struttura proposta** (`src/core/dischi.ts`, ADR-001 · ADR-003 · ADR-004)

```ts
export type Grammi = number;

export declare const BILANCIERE: Grammi;
export declare const DISCHI_DISPONIBILI: readonly Grammi[];

export type Scomposizione =
  | { esito: "ok"; caricoReale: Grammi; perLato: readonly Grammi[] }
  | { esito: "avviso"; caricoReale: Grammi; perLato: readonly Grammi[]; avviso: "solo-bilanciere" }
  | { esito: "non-valido"; errore: string };

export declare function scomponiInDischi(
  target: Grammi,
  bilanciere: Grammi,
  dischi: readonly Grammi[],
): Scomposizione;
```

Tutto è in grammi interi (ADR-003). L'esito usa union di stringhe e non `enum`, perché il type stripping di Node non supporta gli `enum` (ADR-005). Passare bilanciere e dischi come parametri rende la funzione pura e facile da testare (ADR-001).

**Gradino 1 · Domanda**

Il target è 102,5 kg. Immagina di essere in palestra davanti alla rastrelliera, senza calcolatrice.
Togli il bilanciere: quanti kg devono andare **per lato**? Quale disco prendi per primo, e perché proprio quello? Cosa guardi per decidere se ne prendi un altro uguale o passi al successivo?

Scrivi a parole i passi che fai a mano. Quella è già la tua funzione.

**Checklist per passare la review**
- Nessun `console` e nessun `process` dentro `core` (ADR-001).
- Solo aritmetica intera in grammi. Nessun `0.5` o `1.25` nel calcolo (ADR-003).
- Sotto i 20 kg l'esito è `solo-bilanciere`, mai dischi negativi (ADR-004).
- Vale sempre `bilanciere + 2 × somma(perLato) = caricoReale ≤ target`.
- `perLato` va dal disco più pesante al più leggero.
- L'array `dischi` ricevuto non viene modificato (`best practice`).

**Casi di test da scrivere con `node:test`** (ADR-005)
- 20 kg → nessun disco.
- 60 kg → un 20 per lato.
- 102,5 kg → 25, 15, 1,25 per lato.
- 101 kg → carico reale 100, cioè 25 e 15 per lato.
- 15 kg → avviso `solo-bilanciere`.

Se ti blocchi, il prossimo gradino è un esempio analogo su un altro problema.
