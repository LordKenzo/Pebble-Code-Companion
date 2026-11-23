I won't write the `canCancel` test, because tests are your project's logic. I can show you the style on a different function, then describe your cases in words.

**The style, on an analogous case** (a library loan, not your domain):

```ts
it('is not overdue exactly at the due time', () => {
  expect(isOverdue(at('2026-03-10T09:00:00Z'), at('2026-03-10T09:00:00Z'))).toBe(false)
})
```

What I'd look for in yours (`buona pratica`):

- **The name is a sentence about behaviour.** It describes the rule, not the implementation. "returns true when hoursLeft >= 12" says nothing a reader can check against the requirements.
- **`now` is passed in, never `new Date()` inside the test.** Your signature already allows this. Good call, it's what makes the function testable.
- **Fixed ISO dates with an explicit `Z`.** Otherwise tests pass on your machine and fail in CI in another timezone. A tiny `at(iso)` helper keeps lines readable.
- **One behaviour per test, one `expect`.** When it fails, the name alone tells you what broke.
- **Express the offset through the constant where it helps.** Build "12 hours before start" from `CANCEL_WINDOW_HOURS`. If the window changes, the boundary tests follow it.

**Cases for `canCancel`, in priority order:**

1. `limite`: it allows cancelling exactly 12 hours before the start. This pins down your `>=`.
2. `limite`: it refuses cancelling 1 minute inside the window (11h59m before).
3. `base`: it allows cancelling well ahead, for example 3 days before.
4. `bordo`: it refuses cancelling once the course has started (`now` equal to `startsAt`).
5. `bordo`: it refuses cancelling after the start (negative `hoursLeft`).

Start with case 1. Off-by-one mistakes at the boundary are the most likely bug here, and that test documents the rule.

**Checklist to pass review:** no real clock, timezone explicit, boundaries on both sides of 12h, no logic inside the test (no computing the expected value with the same formula as the code).

One question decides case 1: in your bootstrap, is cancelling at *exactly* 12 hours allowed, or must it be *more than* 12? Your code says allowed. Make sure that's the rule, not an accident.
