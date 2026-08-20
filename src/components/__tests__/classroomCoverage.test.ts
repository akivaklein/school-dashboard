import { describe, expect, it } from 'vitest'
import { buildClassroomCoverageSnapshot, initialStudents } from '../dashboardData'

describe('classroom coverage snapshots', () => {
  it('builds a clear coverage snapshot for the current class period', () => {
    const snapshot = buildClassroomCoverageSnapshot(initialStudents, 'b', { id: 1, subject: 'Gemara / Skills Rotation' })
    const firstEntry = snapshot.students[0]

    expect(snapshot.expectedCount).toBe(7)
    expect(snapshot.metrics.present).toBe(0)
    expect(snapshot.metrics.absent).toBe(1)
    expect(snapshot.metrics.late).toBe(0)
    expect(snapshot.metrics.pullout).toBe(0)
    expect(snapshot.students.some(entry => entry.location && entry.location.length > 0)).toBe(true)
    expect(firstEntry.expectedLocation).toBeTruthy()
    expect(firstEntry.actualCurrentLocation).toBeTruthy()
    expect(firstEntry.provider).toBeTruthy()
    expect(firstEntry.serviceType).toBeTruthy()
    expect(firstEntry.scheduledDeparture).toBeTruthy()
    expect(firstEntry.expectedReturn).toBeTruthy()
    expect(firstEntry.actualDeparture).toBeTruthy()
    expect(firstEntry.actualReturn).toBeTruthy()
    expect(['scheduled', 'unexpected']).toContain(firstEntry.scheduledVersusUnexpected)
    expect(['approved', 'unexplained']).toContain(firstEntry.approvedVersusUnexplained)
    expect(['present', 'late', 'absent', 'unresolved', 'unknown']).toContain(firstEntry.statusCode)
  })

  it('supports multiple class-period scenarios with different coverage mixes', () => {
    const periodTwo = buildClassroomCoverageSnapshot(initialStudents, 'a', { id: 2, subject: 'Kriah / Writing Block' })
    const periodThree = buildClassroomCoverageSnapshot(initialStudents, 'yk-a', { id: 3, subject: 'Social Skills / SEL' })

    expect(periodTwo.expectedCount).toBe(7)
    expect(periodTwo.metrics.present).toBe(0)
    expect(periodThree.expectedCount).toBe(8)
    expect(periodThree.metrics.present).toBe(0)
    expect(periodThree.metrics.late).toBe(3)
  })

  it('does not include archived students in classroom expectations', () => {
    const archivedStudent = { ...initialStudents[0], id: 999, is_active: false }
    const snapshot = buildClassroomCoverageSnapshot([...initialStudents, archivedStudent], 'a', { id: 1, subject: 'Gemara' })

    expect(snapshot.expectedCount).toBe(7)
    expect(snapshot.students.some(entry => entry.studentId === 999)).toBe(false)
  })
})
