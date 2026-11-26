Tests are logic, so I won't write a full one. Here is the style I'd expect, as cases in words plus the one construct that matters.

**Style (best practice):**
- One behaviour per test. The name says the rule, not the function: *"allows cancelling exactly 12 hours before start"*.
- **Inject time, never read the clock.** Your signature already takes `now`, which is good. Tests should pass a fixed `now` and build `startsAt` relative to it, so the test reads like the rule.
- Express offsets with `CANCEL_WINDOW_HOURS`, not a hard-coded `12`. If the window changes, the tests follow.
- Arrange / act / assert, no shared mutable setup.

**The construct, in 3 lines:**

```ts
const now = new Date('2026-01-10T10:00:00Z')
const hours = (h: number) => new Date(now.getTime() + h * 3_600_000)
// canCancel(hours(CANCEL_WINDOW_HOURS), now) → expect true
```

**Cases I'd want to see for `canCancel`:**
1. Well before the window (e.g. 48h left) → true.
2. **Exactly** at the window → true. This pins down your `>=`.
3. Just inside the window (window minus 1 minute) → false. The minute matters because a 1-hour step would miss off-by-a-bit bugs.
4. Course already started (`startsAt` in the past) → false.
5. `startsAt` equal to `now` → false.

Cases 2 and 3 are the ones that catch real bugs. A test suite with only cases 1 and 4 would still pass if someone changed `>=` to `>`.

**Checklist for review:**
- No `new Date()` without an argument, and no fake timers needed.
- Boundary is tested on both sides.
- Dates are in UTC (`Z` suffix), so the tests don't depend on the machine's timezone.
- Test names state the rule.

One question, because it changes case 2: is "exactly 12 hours before" meant to be allowed, or does the gym's rule say *more than* 12 hours? Your code allows it, so the test should lock in whichever the requirement actually says.
