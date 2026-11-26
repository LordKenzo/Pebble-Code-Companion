**The code**

`src/core/plates.ts`. The greedy loop used `>`, so a plate equal to the remainder was skipped. For 60 kg, the 20 kg plate never matched exactly, and 1.25 kg was silently left over. The second change makes any leftover invalid.

```diff
-import { ok, type Result } from "./result.ts";
+import { invalid, ok, type Result } from "./result.ts";
 ...
   for (const plate of PLATES) {
-    while (remaining > plate) {
+    while (remaining >= plate) {
       perSide.push(plate);
       remaining -= plate;
     }
   }
+  if (remaining !== 0) {
+    return invalid(`load not composable: ${remaining} g per side left over`);
+  }
   return ok({ total, perSide });
```

- **The `invalid` name is a guess.** I haven't seen `result.ts`, so swap in whatever your error constructor is called (ADR-004).
- **Odd input stays safe.** If `total - BAR` is odd, `remaining` becomes fractional (for example 625.5). No plate can cover that, so it ends up invalid instead of producing a broken load. Grams stay integers through subtraction, so there's no float drift (ADR-003).
- **Alternative:** guard up front with `(total - BAR) % 2_500 !== 0 → invalid`. It's cheaper and states the 2.5 kg contract explicitly. The trade-off is that it hard-codes the smallest plate. The leftover check derives everything from `PLATES`, so it survives adding 0.5 kg plates.

**Tests to add** (run them over the existing cases):
- `platesFor(60_000)` returns ok with `perSide` equal to `[20_000]`. This was your red test.
- `platesFor(102_500)` returns ok with `[25_000, 15_000, 1_250]`.
- `platesFor(21_250)` returns invalid. That's 625 g per side, which no plate covers.
- `platesFor(20_000)` returns ok with `[]` and no warnings. It's exactly the bar and must not hit the below-bar branch.

**One open point, not fixed here:** the below-bar branch returns `total: BAR`. That exceeds the target, which goes against ADR-003's "never above target". ADR-004 explicitly allows it with a warning, so the two ADRs disagree. Worth stating in ADR-003 that bar-only is the one exception.
