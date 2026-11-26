Ecco la funzione. Va in `src/core/dischi.ts`, perché calcola soltanto e non parla con il terminale (ADR-001). Lavora in grammi interi (ADR-003).

```ts
const BILANCIERE_GRAMMI = 20000;

// Dischi disponibili per lato, dal più pesante al più leggero.
const DISCHI_PER_LATO_GRAMMI = [25000, 20000, 15000, 10000, 5000, 2500, 1250];

export type DiscoPerLato = { pesoGrammi: number; quantita: number };

export function dischiPerLato(caricoTotaleGrammi: number): DiscoPerLato[] {
  let daCaricare = (caricoTotaleGrammi - BILANCIERE_GRAMMI) / 2;
  const risultato: DiscoPerLato[] = [];

  for (const peso of DISCHI_PER_LATO_GRAMMI) {
    const quantita = Math.floor(daCaricare / peso);
    if (quantita > 0) {
      risultato.push({ pesoGrammi: peso, quantita });
      daCaricare -= quantita * peso;
    }
  }

  return risultato;
}
```

Cosa fa, riga per riga:

- `BILANCIERE_GRAMMI`: il peso del bilanciere, 20 kg. Lo scrivo una volta sola così, se cambia, si cambia in un posto.
- `DISCHI_PER_LATO_GRAMMI`: la lista dei dischi, in grammi (25 kg = 25000). Sono in ordine dal più pesante, perché la funzione parte dal più grande.
- `export type DiscoPerLato`: descrive la forma di un risultato: un peso e quante copie ne servono. `export` serve perché la CLI e i test lo useranno.
- `let daCaricare`: il peso che manca da caricare su un lato. Tolgo il bilanciere, divido per due perché i dischi sono uno per lato. `let` perché il valore cambia man mano.
- `for (const peso of ...)`: ripete il blocco per ogni disco della lista, dal più pesante.
- `Math.floor(daCaricare / peso)`: quanti dischi di quel peso ci stanno. `floor` arrotonda per difetto, come vuole ADR-003.
- `if (quantita > 0)`: aggiunge al risultato solo i dischi che servono davvero.
- `daCaricare -= quantita * peso`: toglie il peso già coperto, così il giro dopo lavora sul resto.

Il metodo si chiama "avido" (greedy): prende sempre il disco più pesante che ci sta. Con questa lista funziona, perché ogni peso è multiplo del 1,25 kg.

Il test, in `src/core/dischi.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { dischiPerLato } from "./dischi.ts";

test("60 kg totali: un disco da 20 kg per lato", () => {
  assert.deepEqual(dischiPerLato(60000), [{ pesoGrammi: 20000, quantita: 1 }]);
});
```

Lancialo con `npm test`. Il test passa solo se la funzione restituisce esattamente un disco da 20 kg per lato.

Una cosa che la funzione non controlla: che il carico sia almeno 20 kg e multiplo di 2,5 kg. Quella verifica spetta al passaggio di arrotondamento (ADR-004), che viene prima.

Prima di eseguire niente: con 62,5 kg totali, quali dischi escono per lato?
