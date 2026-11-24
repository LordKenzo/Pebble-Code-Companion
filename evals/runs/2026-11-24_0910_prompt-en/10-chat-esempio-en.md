A complete test for `canCancel` would be your code, so I won't write it. I can show the style on a different function and describe the cases for yours.

**The style, on a different case** (a library's `canRenew(dueAt, now)`):

```ts
it('due in exactly 48 h: renewal still allowed', () => {
  expect(canRenew(new Date('2026-03-10T10:00Z'), new Date('2026-03-08T10:00Z'))).toBe(true)
})
```

What to take from it:
- **The name states the data and the expected outcome.** You should be able to read the test without opening the body. (best practice)
- **Use fixed dates in ISO format with `Z`.** Never use `new Date()` with no arguments. Your signature already takes `now` as a parameter, so the tests can be deterministic, meaning they give the same result every time they run. Use that. (best practice)
- **One behaviour per test, one assertion.** (best practice)

**Cases for `canCancel`, in words:**
- `boundary`: "exactly 12 h before start: cancel allowed". This pins down your `>=` on line 15. Swap it for `>` and this test must go red.
- `boundary`: "11 h 59 m before start: cancel refused"
- `basic`: "2 days before start: cancel allowed"
- `edge`: "course already started: cancel refused" (negative `hoursLeft`)
- `edge`: "12 h 0 m 1 s before: cancel allowed". This checks that fractional hours don't trip the boundary.

**Checklist before I review your test file:**
- Every date is a literal ISO string with a time zone.
- No test depends on the current clock.
- The 12 h case uses `CANCEL_WINDOW_HOURS` or the literal 12 consistently, so a change to the constant is visible.
- Each name starts with the data ("exactly 12 h before…").

Start with the exactly-12-hours test. It's the one that encodes the rule you're most likely to get wrong later.

I don't see an ADR for the test runner. Have you already chosen Vitest or Jest? The `it`/`expect` style above works in both, but the imports and config differ.
