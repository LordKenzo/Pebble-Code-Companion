Il corpo di `dischiPerLato` è logica del progetto, quindi non te lo scrivo, nemmeno come esempio. Ti do la firma, un esempio analogo e la checklist che userò in review.

**Firma proposta** (ADR-003 grammi interi, ADR-004 esito esplicito)

```ts
export type Grammi = number;
export type Esito = 'ok' | 'avviso' | 'non-valido';

export interface Scomposizione {
  esito: Esito;
  caricoReale: Grammi;   // totale, bilanciere incluso
  dischiPerLato: Grammi[]; // dal più pesante
  avviso?: string;
}

export declare const BILANCIERE: Grammi;
export declare const DISCHI: readonly Grammi[];

export declare function scomponi(caricoTotale: Grammi): Scomposizione;
```

Usa union di stringhe e non `enum`, perché il type stripping non li supporta (ADR-005).

**Gradino 3 · Esempio analogo**
Pensa a un distributore che dà il resto di 3,70 € con monete da 2, 1, 0,50, 0,20 e 0,10:
1. Lavora in centesimi interi, cioè 370, così eviti l'errore di 0,1 + 0,2.
2. Parti dalla moneta più grande.
3. Finché quella moneta ci sta nel resto, la aggiungi alla lista e la sottrai.
4. Quando non ci sta più, passi alla moneta successiva.
5. Ti fermi quando il resto arriva a zero.

Questo approccio si chiama *algoritmo greedy*. Funziona perché ogni taglio delle monete è "ben assortito" rispetto agli altri. Cercalo per approfondire.

Il tuo caso ha due passi in più prima del greedy. Prima togli il bilanciere, poi dividi per due perché i dischi vanno in coppia. E il carico va arrotondato per difetto al componibile (ADR-003).

**Checklist per passare la review**
- Nessun `console` e nessun `process` nel file (ADR-001).
- Solo interi in grammi. I kg compaiono solo nella CLI (ADR-003).
- `caricoReale` non supera mai il target (ADR-003).
- Sotto i 20 kg l'esito è «solo bilanciere» con avviso e la lista dischi è vuota, mai dischi negativi (ADR-004).
- I dischi sono illimitati per taglio, quindi nessun inventario da gestire (ADR-004).
- Test da scrivere prima: "60 kg: un 20 per lato", "15 kg: solo bilanciere, con avviso", "20 kg: bilanciere senza dischi", "61 kg: arrotonda a 60", "22,5 kg: un 1,25 per lato" (bootstrap › Vincoli).

Ti serve una scelta prima di iniziare: l'arrotondamento per difetto lo vuoi dentro `scomponi` o in una funzione separata che `scomponi` riceve già arrotondato?
