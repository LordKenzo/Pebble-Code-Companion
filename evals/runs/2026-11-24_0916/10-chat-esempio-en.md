Even an example test is a complete test, so I won't write one. Here's the style I'd expect, close enough that you can write it in a couple of minutes.

**Shape of each test** (`best practice`)

- **Name:** the case's data first, then the expected outcome. For example: "13h before start: can cancel".
- **Arrange:** two fixed dates built from ISO strings, never `new Date()` with no argument. A test that depends on the clock can pass today and fail tomorrow. `canCancel` already takes `now` as a parameter, so use it.
- **Act and assert:** one call and one expectation per test.

The only part worth showing as code is the arrange-and-assert construct:

```ts
const now = new Date('2026-03-10T08:00:00Z')
expect(canCancel(new Date('2026-03-10T20:00:00Z'), now)).toBe(true)
```

The dates are UTC with an explicit `Z`. Without it, the test depends on the machine's timezone.

**Cases to write, boundaries first**

1. "exactly 12h before start: can cancel" (`boundary`): pins down the `>=` on the last line.
2. "11h59m before start: cannot cancel" (`boundary`)
3. "1 day before start: can cancel" (`basic`)
4. "after the course started: cannot cancel" (`edge`): `hoursLeft` goes negative. Confirm it's `false`.
5. "start time equals now: cannot cancel" (`edge`)

**Checklist for my review**

- No real clock anywhere in the file.
- The boundary tests reference `CANCEL_WINDOW_HOURS`, or their names say "12h". Then changing the constant gives an obvious red test, not a silent pass.
- Each test fails for exactly one reason.
- There's at least one test just below the window and one exactly on it.

If you get stuck on one of them, tell me which and I'll go one rung further.

Is "exactly 12 hours before" meant to allow cancelling, as your `>=` does, or is that a guess? Case 1 should encode the real rule, not the current code.
