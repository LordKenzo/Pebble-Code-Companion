Partiamo dall'idea, poi il codice. Per mettere i dischi su un lato:

1. togli i 20 kg del bilanciere dal carico totale;
2. dividi per 2, perché i dischi vanno in coppia (`bootstrap › Vincoli`);
3. prendi sempre il disco più grande che ci sta ancora, finché non resta niente.

Lavoriamo in **grammi interi**, cioè 1,25 kg diventa `1250`, per evitare gli errori dei numeri con la virgola (`ADR-003`).

**Il codice**

```ts
// src/core/dischi.ts
export const BILANCIERE_G = 20_000;
export const DISCHI_G = [25_000, 20_000, 15_000, 10_000, 5_000, 2_500, 1_250];

export function dischiPerLato(caricoTotaleG: number): number[] {
  const perLatoG = (caricoTotaleG - BILANCIERE_G) / 2;
  if (perLatoG <= 0) return [];

  const dischi: number[] = [];
  let restanteG = perLatoG;
  for (const disco of DISCHI_G) {
    while (restanteG >= disco) {
      dischi.push(disco);
      restanteG -= disco;
    }
  }
  return dischi;
}
```

Riga per riga:
- `BILANCIERE_G` e `DISCHI_G`: il peso del bilanciere e i dischi disponibili, in grammi, dal più grande al più piccolo. L'ordine conta.
- `perLatoG`: quanto peso va su **un** lato.
- `if (perLatoG <= 0) return []`: con 20 kg o meno non serve nessun disco, quindi la lista è vuota e non ci sono mai dischi negativi (`ADR-004`). L'avviso «solo bilanciere» lo aggiungerà la funzione che chiama questa.
- `for … of`: un **ciclo**, cioè un pezzo di codice ripetuto, qui una volta per ogni tipo di disco.
- `while`: finché quel disco ci sta ancora, lo aggiunge alla lista e lo sottrae dal resto.

La funzione è **pura**: non legge il terminale e non stampa niente, quindi può stare nel `core` (`ADR-001`). Si aspetta un carico già arrotondato per difetto a 2,5 kg (`ADR-003`). Quell'arrotondamento lo fa un'altra funzione.

**Il test che lo dimostra** (`ADR-005`):

```ts
// src/core/dischi.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dischiPerLato } from './dischi.ts';

test('100 kg: 25 + 15 per lato', () => {
  assert.deepEqual(dischiPerLato(100_000), [25_000, 15_000]);
});

test('20 kg: solo bilanciere, nessun disco', () => {
  assert.deepEqual(dischiPerLato(20_000), []);
});
```

```sh
node --test
```

Se `tsc` segnala un errore sull'import con `.ts`, aggiungi `"allowImportingTsExtensions": true` in `tsconfig.json`. Serve perché il type stripping di Node vuole l'estensione vera nel percorso (`best practice`).

Per controllare di averla capita: cosa restituisce `dischiPerLato(62_500)`?
