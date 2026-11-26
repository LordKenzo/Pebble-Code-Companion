**Il codice**

In `src/core/plates.ts` sostituisci `platesFor` (righe 13-26):

```ts
/** Dischi per lato per un carico già componibile. */
export function platesFor(total: Grams): Result<PlateLoad> {
  if (total < BAR) {
    return ok({ total: BAR, perSide: [] }, ["sotto il peso del bilanciere"]);
  }
  let remaining = (total - BAR) / 2;
  const perSide: Grams[] = [];
  for (const plate of PLATES) {
    while (remaining >= plate) {
      perSide.push(plate);
      remaining -= plate;
    }
  }
  return ok({ total, perSide });
}
```

**Cosa cambia.** La condizione a riga 20 diventa `>=`. Con `>` il disco veniva saltato quando il resto era esattamente uguale al disco. Per questo il 20 kg finiva spezzato in 15 + 2,5 + 1,25 e l'ultimo 1,25 si perdeva.

**Punti delicati**
- `(total - BAR) / 2` resta un intero solo se `total` è un multiplo di 2.500 g. È una precondizione di ADR-003, e il chiamante deve arrotondare prima.
- Se arriva un carico non componibile, alla fine del ciclo resta `remaining > 0` e quei grammi spariscono senza avviso. Per ADR-004 conviene restituire un avviso o un esito non valido quando `remaining !== 0`.

**Test da aggiungere.** Con 47,5 kg il resto per lato è 13.750 g e `perSide` deve valere `[10_000, 2_500, 1_250]`. Il caso tocca tre uguaglianze di fila alla fine del ciclo, quindi fallisce con `>`.

**Concetto:** errore off-by-one (confronto stretto invece che non stretto)
