import type { Booking, Course, Member } from './types'
import { BookingError } from './errors'

export const CANCEL_WINDOW_HOURS = 12

export function book(course: Course, member: Member): Booking | BookingError {
  if (course.booked >= course.capacity) {
    return BookingError.courseFull(course.id)
  }
  return { courseId: course.id, memberId: member.id, status: 'confirmed' }
}

export function canCancel(startsAt: Date, now: Date): boolean {
  const hoursLeft = (startsAt.getTime() - now.getTime()) / 3_600_000
  return hoursLeft >= CANCEL_WINDOW_HOURS
}
