import { describe, expect, it } from 'vitest'
import { applyStudentClassAssignments, buildClassroomCoverageSnapshot, initialStudents, resolveStudentClassId } from '../dashboardData'

const assignments = Object.fromEntries([
  ...Array.from({ length: 8 }, (_, index) => [101 + index, { classId: 'yk-a', divisionKey: 'yeshiva_ketana' }]),
  ...Array.from({ length: 7 }, (_, index) => [109 + index, { classId: 'yk-b', divisionKey: 'yeshiva_ketana' }]),
])
const assignedStudents = applyStudentClassAssignments(initialStudents, assignments)

describe('classroom coverage snapshots', () => {
  it('builds a clear coverage snapshot for the current class period', () => {
    const snapshot = buildClassroomCoverageSnapshot(assignedStudents, 'yk-b', { id: 1, subject: 'Gemara / Skills Rotation' })
    const firstEntry = snapshot.students[0]

    expect(snapshot.expectedCount).toBe(7)
    expect(snapshot.metrics.present).toBe(0)
    expect(snapshot.metrics.present + snapshot.metrics.absent + snapshot.metrics.late + snapshot.metrics.pullout + snapshot.metrics.unknown).toBeGreaterThanOrEqual(snapshot.expectedCount)
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
    const periodTwo = buildClassroomCoverageSnapshot(assignedStudents, 'yk-b', { id: 2, subject: 'Kriah / Writing Block' })
    const periodThree = buildClassroomCoverageSnapshot(assignedStudents, 'yk-a', { id: 3, subject: 'Social Skills / SEL' })

    expect(periodTwo.expectedCount).toBe(7)
    expect(periodThree.expectedCount).toBe(8)
  })

  it('does not include archived students in classroom expectations', () => {
    const archivedStudent = { ...initialStudents.find(student => student.id === 101), id: 999, is_active: false }
    const projected = applyStudentClassAssignments([...initialStudents, archivedStudent], { ...assignments, 999: { classId: 'yk-a', divisionKey: 'yeshiva_ketana' } })
    const snapshot = buildClassroomCoverageSnapshot(projected, 'yk-a', { id: 1, subject: 'Gemara' })

    expect(snapshot.expectedCount).toBe(8)
    expect(snapshot.students.some(entry => entry.studentId === 999)).toBe(false)
  })

  it('uses the Student Class Assignment instead of legacy student fields', () => {
    const [student] = applyStudentClassAssignments([{ id: 113, class_id: 'yk-a', class_name: '8th Grade' }], { 113: { classId: 'yk-b', divisionKey: 'yeshiva_ketana' } })
    expect(resolveStudentClassId(student)).toBe('yk-b')
  })
})
