I won't write the test itself, even as a sample: deciding what to assert is the part that teaches you the most about your own rule. Here's the style I'll look for, plus the cases to cover.

**Style I expect** (`buona pratica`)

- **One behavior per test**, with a name that states the rule, e.g. *"allows cancelling exactly 12 hours before start"*.
- **Fixed dates, never `new Date()`.** `canCancel` already takes `now` as a parameter, which is good design. Use it so the tests don't depend on when they run.
- **Arrange / act / assert.** Build `startsAt` and `now`, call the function once, then check one boolean.
- **Derive `now` from `startsAt`.** Readers should see the gap ("start minus 12h") instead of computing it from two timestamps.

The shape, shown on a different function (a library loan, not your code):

```ts
const dueAt = new Date('2026-03-10T09:00:00Z')
const now = new Date(dueAt.getTime() + 1 * 60_000) // one minute late
expect(isOverdue(dueAt, now)).toBe(true)
```

**Cases for `canCancel`**

1. `limite`: exactly 12h before start → allowed. This is where `>=` versus `>` matters, so start here.
2. `limite`: 12h minus one minute → refused.
3. `base`: two days before → allowed.
4. `bordo`: course already started (`now` after `startsAt`) → refused. Check the negative `hoursLeft` gives the right answer.
5. `bordo`: `now` equals `startsAt` → refused.

**Checklist to pass my review**

- The test names describe the rule, not the implementation.
- No real clock anywhere.
- Both sides of the 12h boundary are covered, not only one.
- If you reference `CANCEL_WINDOW_HOURS`, at least one test still uses a literal "12h" date. Otherwise someone could change the constant to 1 and every test would stay green.

Which test runner is the project using (Vitest, Jest…)? If none is set up yet, I'll give you the install command and config.
