**Gradino 4 · La riga esatta**

**Il codice**

Alla riga 20 il confronto deve includere l'uguale. Ecco `platesFor` corretta in `src/core/plates.ts`, con il cambio segnato:

```ts
/** Dischi per lato per un carico già componibile. */
export function platesFor(total: Grams): Result<PlateLoad> {
  if (total < BAR) {
    return ok({ total: BAR, perSide: [] }, ["sotto il peso del bilanciere"]);
  }
  let remaining = (total - BAR) / 2;
  const perSide: Grams[] = [];
  for (const plate of PLATES) {
    while (remaining >= plate) { // era `>`: il disco va preso anche quando il resto è uguale
      perSide.push(plate);
      remaining -= plate;
    }
  }
  return ok({ total, perSide });
}
```

Con `>` il disco da 20 kg veniva saltato quando il resto per lato era esattamente 20 kg. Con `>=` il disco viene preso, il resto va a zero e il ciclo successivo non aggiunge nulla. Il 142,5 kg torna `[25, 25, 10, 1.25]`, perché l'ultimo 1,25 esatto ora entra.

**Concetto:** confine incluso nei confronti (`>` contro `>=`).

Dopo la modifica, `node --test` deve dare verde sui quattro test di `platesFor`. Un punto da tenere d'occhio: se `remaining` non arriva a zero alla fine del ciclo, il carico non è componibile. La funzione oggi lo ignora in silenzio. Questo è coperto dal fatto che il chiamante deve arrotondare prima, come dice ADR-003, ma vale la pena aggiungere un test che lo verifichi.
