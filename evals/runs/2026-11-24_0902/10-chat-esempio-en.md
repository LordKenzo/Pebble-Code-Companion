Writing a full test, even as a style sample, would mean writing one of your tests for you. Here's the next step up instead: the same style on a different function, plus the cases for `canCancel` in words.

**Style, shown on an analogous case** (a hypothetical `isLate(dueAt, now)` for a library loan):

```ts
it('exactly at due time: not late', () => {
  expect(isLate(new Date('2026-01-10T18:00Z'), new Date('2026-01-10T18:00Z'))).toBe(false)
})
```

What to copy from it (`buona pratica`):
- **The name starts with the data of the case**, then the expected outcome. When a test fails, the name alone tells you which boundary broke.
- **Fixed dates written in UTC** (`Z`), never `new Date()` with no arguments. Your `canCancel` already takes `now` as a parameter, which makes this possible.
- **One behaviour per test**, one assertion, no shared state between tests.

**Cases for `canCancel`, limits first:**
1. "exactly 12 h before: can cancel" (`limite`). Your `>=` says yes. Make sure the bootstrap agrees.
2. "11 h 59 min before: cannot cancel" (`limite`)
3. "12 h 1 min before: can cancel" (`limite`)
4. "3 days before: can cancel" (`base`)
5. "1 h before: cannot cancel" (`base`)
6. "course already started: cannot cancel" (`bordo`). Here `hoursLeft` is negative.
7. "12 h across a DST change: still counted as real hours" (`bordo`). `getTime()` handles this correctly. The test pins that down so nobody later switches to calendar arithmetic.

**Checklist for passing review:**
- The cases right around `CANCEL_WINDOW_HOURS` (the exact boundary and one minute on each side) are covered.
- Tests reference `CANCEL_WINDOW_HOURS` by meaning in the name, but use literal dates in the body. Don't recompute the boundary with the same formula as the code.
- There's no dependency on the machine's clock or timezone.
- `book` gets its own tests: free spot, last spot (`booked = capacity - 1`), and full.

Which test runner did the project decide on (Vitest, Jest, `node:test`)? The `it`/`expect` shape above works for the first two. With `node:test` the assertions change.
