A full test, even as an example, is still a full test, so I won't write one. Here's what a test for `canCancel` needs to pass my review. (No ADRs or bootstrap in context, so everything below is `generale`.)

**Checklist for `canCancel` tests**

- **One behavior per test, named as a sentence.** The name should read as the rule, e.g. *"allows cancelling exactly 12 hours before start"*. If the test fails, the name alone should tell you what broke.
- **Fixed, explicit dates. Never `new Date()` without arguments.** `canCancel` already takes `now` as a parameter, so use it. A literal ISO string with `Z` keeps the test independent of the machine's timezone:
  `const startsAt = new Date('2026-03-10T18:00:00Z')`
- **Build `now` relative to `startsAt`.** Derive it from `startsAt` minus an offset, so the 12h gap is visible in the test rather than hidden in two hand-typed timestamps.
- **Use `CANCEL_WINDOW_HOURS` for the boundary cases.** If the window changes, those tests follow it. Tests that encode a *business* expectation can use the literal 12 on purpose, so a change becomes a conscious decision.
- **Arrange / act / assert, visibly separated.** One call to `canCancel`, one assertion.
- **No mocks.** It's a pure function, so you don't need fake timers here.

**Cases I'd expect to see**

| Test name | Label |
|---|---|
| allows cancelling exactly 12 hours before start | `limite` |
| refuses cancelling 1 millisecond under 12 hours | `limite` |
| allows cancelling well ahead of the window (e.g. 3 days) | `base` |
| refuses cancelling after the course has started | `errore` |
| refuses cancelling exactly at start time | `bordo` |

Start with the exact-12-hours test. It pins down the `>=` on line 16, the decision most likely to get flipped by accident.

One question before you write them: is "12 hours" a fixed span of time, or "the same clock time the day before" for members? Your function measures milliseconds, so across a DST change those two rules give different answers. The tests should reflect whichever one the gym actually means.
