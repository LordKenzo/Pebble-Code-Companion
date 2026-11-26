**Il codice**

Va in un file nuovo, `src/core/dischi.ts`. È una funzione pura (riceve dei valori e restituisce un risultato, senza stampare nulla né leggere il terminale), come chiede ADR-001.

```ts
// src/core/dischi.ts
export type Grammi = number;

export const PESO_BILANCIERE: Grammi = 20_000;
export const DISCHI: readonly Grammi[] = [25_000, 20_000, 15_000, 10_000, 5_000, 2_500, 1_250];

export type RisultatoDischi =
  | { esito: "ok"; dischiPerLato: Grammi[]; caricoReale: Grammi }
  | { esito: "avviso"; dischiPerLato: Grammi[]; caricoReale: Grammi; avviso: string }
  | { esito: "errore"; errore: string };

export function calcolaDischi(caricoTotale: Grammi): RisultatoDischi {
  if (!Number.isInteger(caricoTotale) || caricoTotale <= 0) {
    return { esito: "errore", errore: "Il carico deve essere un numero intero di grammi maggiore di 0." };
  }

  if (caricoTotale < PESO_BILANCIERE) {
    return {
      esito: "avviso",
      dischiPerLato: [],
      caricoReale: PESO_BILANCIERE,
      avviso: "Carico sotto il peso del bilanciere: solo bilanciere.",
    };
  }

  let restoPerLato = Math.floor((caricoTotale - PESO_BILANCIERE) / 2);
  let caricoPerLato = 0;
  const dischi: Grammi[] = [];

  for (const disco of DISCHI) {
    while (restoPerLato >= disco) {
      dischi.push(disco);
      restoPerLato -= disco;
      caricoPerLato += disco;
    }
  }

  return { esito: "ok", dischiPerLato: dischi, caricoReale: PESO_BILANCIERE + 2 * caricoPerLato };
}
```

**Riga per riga, in parole semplici**

- `Grammi`: è solo un altro nome per `number`. Serve a ricordarti che si lavora in grammi interi, mai in kg con la virgola (ADR-003).
- `PESO_BILANCIERE` e `DISCHI`: i dati del bootstrap › Vincoli. I dischi sono in ordine dal più grande al più piccolo, e l'ordine conta.
- `RisultatoDischi`: i tre esiti possibili di ADR-004. Il nome giusto per la forma `A | B | C` è *union*: il valore è uno solo dei tre.
- Primo `if`: un carico negativo o con la virgola non ha senso, quindi la funzione restituisce un errore invece di inventare dei dischi.
- Secondo `if`: sotto i 20 kg la funzione risponde «solo bilanciere» con un avviso. Non arriva mai a dischi negativi (ADR-004).
- `restoPerLato`: toglie il bilanciere e divide per due, perché i dischi vanno in coppia. `Math.floor` toglie l'eventuale mezzo grammo.
- Il ciclo `for` + `while`: per ogni disco, dal più grande, ne mette finché ci sta. È un *algoritmo goloso* (prende sempre il pezzo più grande possibile) e con questi dischi funziona.
- Quello che resta in `restoPerLato` alla fine non si può comporre, e viene scartato. Così il carico va sempre **per difetto**, come vuole ADR-003.
- `caricoReale`: è il peso vero sul bilanciere. Lo restituisci perché l'output deve mostrare sia il target sia il reale (ADR-003).

**Il test che lo dimostra**

`src/core/dischi.test.ts`, con `node:test` (ADR-005):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcolaDischi } from "./dischi.ts";

test("84 kg si arrotonda per difetto a 82,5 kg", () => {
  assert.deepEqual(calcolaDischi(84_000), {
    esito: "ok",
    dischiPerLato: [25_000, 5_000, 1_250],
    caricoReale: 82_500,
  });
});

test("sotto i 20 kg: solo bilanciere con avviso", () => {
  assert.equal(calcolaDischi(15_000).esito, "avviso");
});
```

Lancialo con `npm test`. Se `tsc` si lamenta del `.ts` nell'import, aggiungi `"allowImportingTsExtensions": true` in `tsconfig.json` (best practice con il type stripping).

**Domanda per verificare:** con un carico di 61 kg, quali dischi per lato restituisce, e qual è il `caricoReale`?
