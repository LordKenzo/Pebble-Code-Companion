Since training mode isn't on, I can write code when you ask, including tests. Here's a complete one, so you can see the style directly.

**The code** in `src/domain/booking.test.ts`, next to the module it tests:

```ts
import { describe, it, expect } from 'vitest'
import { canCancel, CANCEL_WINDOW_HOURS } from './booking'

const HOUR = 3_600_000
const startsAt = new Date('2026-12-01T18:00:00Z')
const hoursBefore = (h: number) => new Date(startsAt.getTime() - h * HOUR)

describe('canCancel', () => {
  it('allows cancelling well before the window', () => {
    expect(canCancel(startsAt, hoursBefore(24))).toBe(true)
  })

  it('allows cancelling exactly at the window boundary', () => {
    expect(canCancel(startsAt, hoursBefore(CANCEL_WINDOW_HOURS))).toBe(true)
  })

  it('refuses one minute inside the window', () => {
    const now = new Date(hoursBefore(CANCEL_WINDOW_HOURS).getTime() + 60_000)
    expect(canCancel(startsAt, now)).toBe(false)
  })

  it('refuses after the course has started', () => {
    expect(canCancel(startsAt, hoursBefore(-1))).toBe(false)
  })
})
```

The style choices, one line each:

- **Fixed dates, no `new Date()` with no arguments.** `canCancel` already takes `now` as a parameter, so the test controls time without mocking the clock. That's the payoff of how you wrote it (`best practice`: inject time).
- **Times derived from `CANCEL_WINDOW_HOURS`.** If the window changes to 24 h, the tests follow it instead of silently testing the wrong boundary.
- **The boundary is tested on both sides** (exactly 12 h, and 12 h minus one minute). This is where `>=` versus `>` bugs hide, and it's the business rule that matters to members.
- **A `Z` (UTC) timestamp.** `getTime()` counts absolute milliseconds, so time zones and daylight saving changes don't affect the result. The `Z` keeps the fixture unambiguous for whoever reads it.
- **One behaviour per `it`, named as the rule.** A red test reads like a broken requirement.

I've assumed Vitest because there are no ADRs in context. If the project decided on another runner, only the import line changes.

For `book`, the same style applies: one test per outcome (a free spot, a full course, and `booked === capacity` as the boundary).
