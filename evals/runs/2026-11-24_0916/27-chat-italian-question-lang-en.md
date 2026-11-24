In short: **in kg with decimals, the computer gets some calculations "almost" right, and ADR-003 says to always round down. "Almost" plus "round down" can cost you a whole step of 2.5 kg.**

**The problem: decimals in binary**
JavaScript stores numbers in binary (floating point, IEEE 754). Many decimals that look simple to us, like 0.1, 0.2 or 0.57, cannot be represented exactly, just as 1/3 can't be written in decimal. You can check it yourself in `node`:

```sh
node -e "console.log(0.1 + 0.2, 0.57 * 100)"
# 0.30000000000000004 56.99999999999999
```

**Why it matters in this project**
ADR-003 requires you to round down to the nearest buildable multiple. Suppose a percentage calculation should give exactly 100 kg but produces 99.99999999999999. Rounding down to the 2.5 kg multiple gives 97.5 kg instead of 100. The bug is silent, it only shows up with some numbers, and it is hard to catch with tests. The same happens if you check "is it a multiple of 2.5?" with `%` on decimals: you get wrong remainders like 0.0999999….

With integers there is no such problem. 100 kg is `100000`, the step is `2500`, and division, remainder and rounding down are exact (integers are exact up to about 9 million billion, far beyond the 999 kg of ADR-004). This is the general principle of representing money and quantities in the smallest unit as integers (cents, grams). It is a `best practice`, not just a project preference.

**What changes in practice**
- You convert **once at the input** (kg → grams) and **once at the output** (grams → kg). Everything in between is integers.
- Your line 5 is already correct: the `Math.round` is needed precisely because `kg * 1000` can come out as `56999.99999…` instead of `57000`. That is the one place where rounding to nearest is right, because you are correcting a representation error, not choosing a load.

If you want to search further: "floating point arithmetic JavaScript" and "represent money as integer cents".

**Concept:** floating-point arithmetic.
