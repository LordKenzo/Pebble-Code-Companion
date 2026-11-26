**Concetto:** in JavaScript `number` is a binary floating-point number. Many decimal values (0.1, 1.25 × a percentage…) can't be represented exactly. Integers, on the other hand, are exact up to about 9 million billion.

**What actually changes**

Try `0.1 + 0.2` in the Node REPL: you get `0.30000000000000004`, not `0.3`. In this project that error isn't just cosmetic, because of two things ADR-003 asks for:

1. **Rounding down to multiples of 2.5 kg.** Suppose a percentage computed in kg gives `102.49999999999999` instead of `102.5`. "Round down to the nearest multiple" gives `100`, not `102.5`. You lose a buildable load for an invisible error. The opposite case is worse: a value that *should* sit just under a multiple ends up just over it.
2. **Checking whether a load is buildable.** With floats, a check like "is it divisible by 2.5?" can fail on values that are buildable. In grams `102500` is divisible by `2500` exactly, every time.

In grams all the arithmetic is between integers (sums, differences, divisions by the plates), so it is exact. The volumes are tiny: 999 kg is `999000` g, far from the limit (`Number.MAX_SAFE_INTEGER`).

**Your file**

`kgToGrams` is in the right place. `Math.round` is the single point where the decimal input becomes an integer. You convert once at the input and once at the output (grams → kg for printing). In the middle there are no decimals. The principle is *validate/convert at the boundary*: inside the core, the representation is always the safe one.

**A pebble on `units.ts`** (`best practice`)

`type Grams = number` is only an alias. TypeScript will let you pass a value in kg where it expects `Grams`, and the compiler won't complain. If you want the compiler to catch the mix-up, look up "TypeScript branded types". It's an optional step, not urgent.

To read more: MDN › `Number` › the section on number precision (`Number.EPSILON` and `MAX_SAFE_INTEGER`).
