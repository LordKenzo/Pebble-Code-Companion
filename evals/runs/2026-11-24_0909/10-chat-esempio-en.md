A full `canCancel` test is your code to write. I'll show the style on an analogous function in 3 lines, then describe the cases for yours.

**The style, on a different function** (a library loan, `isOverdue(dueAt, now)`):

```ts
it('due at 10:00, now 10:00: not overdue yet', () => {
  expect(isOverdue(new Date('2026-01-01T10:00:00Z'), new Date('2026-01-01T10:00:00Z'))).toBe(false)
})
```

What to take from it (`buona pratica`):
- **The name starts with the data**, then the expected outcome. When it goes red, the name alone tells you which case broke.
- **Both dates are fixed and written as ISO strings with `Z`**. The test is then the same on every machine and in every timezone, with no `new Date()` without arguments.
- **`now` is passed in, not read inside.** Your `canCancel(startsAt, now)` already does this. That choice is what makes it testable.
- **One behaviour per test, one `expect`.**

**Cases for `canCancel`, in words** (boundaries first):
1. "12 h before start: can cancel". This is the exact boundary and checks that you meant `>=` and not `>`.
2. "11 h 59 min before start: cannot cancel". This is just inside the window.
3. "1 min past 12 h: can cancel".
4. "Course already started: cannot cancel". Here `hoursLeft` is negative.
5. "Start 2 days away: can cancel". This is the plain happy path.

Start with case 1. It's the one that catches a real bug.

**Checklist your tests should meet to pass my review:**
- Every date is an explicit UTC ISO string.
- The boundary is tested on both sides, at 12 h and at 11 h 59 min.
- Write the 12 as a literal in the test names and dates, not `CANCEL_WINDOW_HOURS`. Then if someone changes the constant by mistake, a test catches it.
- No shared mutable state between tests.

One question: which test runner did you settle on? I used `it`/`expect`, which works the same in Vitest and Jest. I'd like the imports and config to match your decision.
