import { Pool } from 'pg'

const db = new Pool()

export class Booking {
  async create(courseId: string, memberId: string) {
    const res = await db.query('SELECT * FROM courses WHERE id = $1', [courseId])
    const course = res.rows[0]
    if (course.booked >= course.capacity) {
      throw new Error('full')
    }
    await db.query('INSERT INTO bookings VALUES ($1, $2)', [courseId, memberId])
  }

  canCancel(startsAt: Date) {
    return startsAt.getTime() - Date.now() > 12 * 60 * 60 * 1000
  }
}
