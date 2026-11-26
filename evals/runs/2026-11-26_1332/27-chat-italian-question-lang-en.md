Floating-point numbers can't represent many decimals exactly, and in this project that turns into **a load that's wrong by a whole step**. Integer grams remove the problem.

**What goes wrong with kg as decimals** (best practice, from how JavaScript works)

JavaScript stores numbers in binary, and values like `0.1` or `0.7` have no exact binary form. So:

```ts
0.7 + 0.1                   // 0.7999999999999999
Math.floor((0.7 + 0.1) * 10) // 7, not 8
```

Now apply that to ADR-003. You round **down** to the nearest multiple of 2.5 kg. If a calculation should give exactly `72.5` but produces `72.49999999`, rounding down gives `70`. You lose 2.5 kg for no reason, and the target vs real load output (ADR-003 › Consequences) shows a difference that doesn't really exist. A check like "is this load buildable?" (`load % 2.5 === 0`) can also fail on a load that actually is buildable.

**What integer grams change**

Integers are exact in JS up to about 9 million billion (`Number.MAX_SAFE_INTEGER`). Your largest load is 999 kg = 999,000 g (ADR-004), which is far inside that range. `72500 % 2500 === 0` is always true, so rounding down to 2500 g never slips.

**Why your `kgToGrams` uses `Math.round`**

This is the principle of *converting at the edges*: decimals only exist at the input and output, and the core works on clean integers. `Math.round` cleans up the float at the moment you convert. For example, `1.005 * 1000` gives `1004.9999999999999`. With `Math.floor` you would get 1004, and with `Math.round` you get the 1005 you intended. The ADR-003 "round down" rule applies later, to the computed loads, not to the conversion.

One thing to watch: `Grams` is just `number`, so TypeScript won't stop you from passing kg where grams are expected. Keep the conversion in this one place.

**Read more:** MDN › `Number`, the sections on precision and `Number.MAX_SAFE_INTEGER`.
