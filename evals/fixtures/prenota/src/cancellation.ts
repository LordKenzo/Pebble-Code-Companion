import type { Booking } from './types'

export const CANCEL_WINDOW_HOURS = 12

export type CancelOutcome =
  | { kind: 'free' }
  | { kind: 'late'; hoursLeft: number }
  | { kind: 'already-started' }

export function cancellationOutcome(booking: Booking, startsAt: Date, now: Date): CancelOutcome {
  const hoursLeft = (startsAt.getTime() - now.getTime()) / 3_600_000
  if (hoursLeft <= 0) return { kind: 'already-started' }
  if (hoursLeft >= CANCEL_WINDOW_HOURS) return { kind: 'free' }
  return { kind: 'late', hoursLeft }
}
