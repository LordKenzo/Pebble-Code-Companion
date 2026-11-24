A complete test is still a test, so I'll stay within 3 lines. That's enough to show the style, and you write the rest.

**The style I'd expect** (`best practice`):

```ts
const now = new Date('2026-03-10T08:00:00Z')
const startsAt = new Date('2026-03-10T20:00:00Z') // exactly 12h later
expect(canCancel(startsAt, now)).toBe(true)
```

What to copy from this:
- **Fixed dates, never `new Date()` with no argument.** `canCancel` already takes `now` as a parameter, which is good design. Use that in the test so it gives the same result every day.
- **ISO strings with `Z`.** The test then doesn't depend on the machine's timezone or a daylight-saving change.
- **A comment stating the gap.** A reader sees "12h" without doing date arithmetic.
- **Test names that start with the data,** like "12h before: can cancel".

**Cases to cover**, edge cases first:
1. "12h before: can cancel" (`boundary`): the exact value of `CANCEL_WINDOW_HOURS`
2. "11h59m before: cannot cancel" (`boundary`): one minute inside the window
3. "12h01m before: can cancel" (`boundary`)
4. "48h before: can cancel" (`basic`)
5. "course already started: cannot cancel" (`edge`): `startsAt` before `now` gives negative hours
6. "across a DST change: counts real hours" (`edge`): use two UTC instants 12h apart on a DST weekend

**Checklist before review:**
- No test reads the real clock.
- Each test checks one case.
- Cases 1 and 2 use the constant's value, not a different number, so they still catch the boundary if the constant changes.

One question that changes case 1: does the bootstrap say a member can still cancel at *exactly* 12h before, or only *more than* 12h? Your `>=` assumes "exactly 12h is fine", and the test should pin down whichever rule is right.
