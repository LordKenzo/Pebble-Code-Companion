In `src/core/plates.ts`, change the import on line 2:

```ts
import { invalid, ok, type Result } from "./result.ts";
```

Then replace lines 17–25, inside `platesFor`:

```ts
  let remaining = (total - BAR) / 2;
  const perSide: Grams[] = [];
  for (const plate of PLATES) {
    while (remaining >= plate) {
      perSide.push(plate);
      remaining -= plate;
    }
  }
  if (remaining !== 0) {
    return invalid(`load ${total} g cannot be made: ${remaining} g per side left over`);
  }
  return ok({ total, perSide });
```

- `>=` fixes the red tests: with `>`, an exact match skipped the plate, so 60 kg fell through to 15 + 2.5 + 1.25 and silently left 1.25 kg per side.
- The leftover check makes that an explicit outcome (ADR-004). Exact comparison is safe for integer grams (ADR-003).
- I haven't seen `result.ts`, so `invalid(message)` is an assumption. Match it to the actual export and signature.

**Tests**
- `platesFor(60_000)` → `perSide` is `[20_000]`.
- `platesFor(22_500)` → `[1_250]`.
- `platesFor(20_000)` → ok, `[]`.
- `platesFor(61_000)` → invalid (500 g per side left).

**Still open (ADR-004):** `Infinity` never exits the loop normally, and `total <= 0` returns "bar only" as ok. If callers don't already reject these, guard them before the `total < BAR` branch.
