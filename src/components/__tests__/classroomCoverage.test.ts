import { describe, expect, it } from 'vitest'
import { buildClassroomCoverageSnapshot, initialStudents } from '../dashboardData'

describe('classroom coverage snapshots', () => {
  it('builds a clear coverage snapshot for the current class period', () => {
    const snapshot = buildClassroomCoverageSnapshot(initialStudents, 'b', { id: 1, subject: 'Gemara / Skills Rotation' })

    expect(snapshot.expectedCount).toBe(7)
    expect(snapshot.metrics.present).toBe(4)
    expect(snapshot.metrics.absent).toBe(1)
    expect(snapshot.metrics.late).toBe(0)
    expect(snapshot.metrics.pullout).toBe(1)
    expect(snapshot.students.some(entry => entry.location && entry.location.length > 0)).toBe(true)
  })

  it('supports multiple class-period scenarios with different coverage mixes', () => {
    const periodTwo = buildClassroomCoverageSnapshot(initialStudents, 'a', { id: 2, subject: 'Kriah / Writing Block' })
    const periodThree = buildClassroomCoverageSnapshot(initialStudents, 'yk-a', { id: 3, subject: 'Social Skills / SEL' })

    expect(periodTwo.expectedCount).toBe(7)
    expect(periodTwo.metrics.present).toBe(2)
    expect(periodThree.expectedCount).toBe(8)
    expect(periodThree.metrics.present).toBe(1)
    expect(periodThree.metrics.late).toBe(3)
  })
})
