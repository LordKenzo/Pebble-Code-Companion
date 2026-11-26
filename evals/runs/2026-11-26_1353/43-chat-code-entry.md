Va in `src/core/dischi.ts`: è calcolo puro, senza `console` né `process` (ADR-001).

```ts
const BILANCIERE = 20000;
const DISCHI = [25000, 20000, 15000, 10000, 5000, 2500, 1250];

export type RisultatoDischi =
  | { esito: 'ok'; caricoGrammi: number; perLato: number[] }
  | { esito: 'avviso'; caricoGrammi: number; perLato: number[]; messaggio: string }
  | { esito: 'errore'; messaggio: string };

export function calcolaDischi(targetGrammi: number): RisultatoDischi {
  if (!Number.isFinite(targetGrammi) || targetGrammi <= 0) {
    return { esito: 'errore', messaggio: 'Il peso deve essere un numero maggiore di 0' };
  }
  if (targetGrammi < BILANCIERE) {
    return { esito: 'avviso', caricoGrammi: BILANCIERE, perLato: [], messaggio: 'Sotto i 20 kg: solo bilanciere' };
  }

  let restoPerLato = (targetGrammi - BILANCIERE) / 2;
  let caricoGrammi = BILANCIERE;
  const perLato: number[] = [];

  for (const disco of DISCHI) {
    while (restoPerLato >= disco) {
      perLato.push(disco);
      restoPerLato -= disco;
      caricoGrammi += disco * 2;
    }
  }
  return { esito: 'ok', caricoGrammi, perLato };
}
```

**Riga per riga**
- `BILANCIERE`, `DISCHI`: valori fissi in grammi (ADR-003). I dischi vanno dal più grande al più piccolo: l'ordine è importante.
- `RisultatoDischi`: un *tipo*, cioè la forma della risposta. `|` significa "oppure": ok, avviso o errore (ADR-004).
- `export function`: rende la funzione usabile da altri file. Riceve il peso desiderato.
- Primo `if`: rifiuta zero, negativi e valori che non sono numeri veri (`Number.isFinite`).
- Secondo `if`: sotto i 20 kg restituisce il solo bilanciere con un avviso. Qui il carico supera il target, quindi l'avviso va mostrato.
- `restoPerLato`: i grammi ancora da mettere su un lato.
- `caricoGrammi`: parte dal bilanciere. `perLato`: un *array* (lista), all'inizio vuoto.
- `for`: prova ogni taglio di disco.
- `while`: finché quel disco ci sta, lo aggiunge (`push`), lo toglie dal resto e somma il suo peso due volte (due lati).
- Ultimo `return`: l'avanzo troppo piccolo resta fuori, quindi si arrotonda per difetto (ADR-003).

**Test**, in `src/core/dischi.test.ts` (ADR-005):

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcolaDischi } from './dischi.ts';

test('84 kg diventa 82,5 kg', () => {
  assert.deepEqual(calcolaDischi(84000), { esito: 'ok', caricoGrammi: 82500, perLato: [25000, 5000, 1250] });
});
```

Lancialo con `node --test`. Per controllare di aver capito: cosa restituisce `calcolaDischi(61000)`, e perché?
