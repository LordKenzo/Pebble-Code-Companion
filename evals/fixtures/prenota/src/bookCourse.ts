import type { BookingRepository, Clock } from '../domain/ports'
import { book } from '../domain/booking'
import { BookingError } from '../domain/errors'

export async function bookCourse(
  repo: BookingRepository,
  clock: Clock,
  courseId: string,
  memberId: string,
) {
  const course = await repo.findCourse(courseId)
  const member = await repo.findMember(memberId)
  if (!course || !member) return BookingError.notFound()

  const result = book(course, member)
  if (result instanceof BookingError) return result

  await repo.saveBooking(result)
  await repo.updateCourse({ ...course, booked: course.booked + 1 })
  return result
}
