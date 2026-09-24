import { describe, expect, it } from 'vitest'
import {
  buildClassroomAttendanceFields,
  buildClassroomSessionKey,
  buildLateToClassFields,
  buildTeachingModeWriteFailureMessage,
  didTeachingModeWriteSucceed,
  getClassroomAttendanceStatus,
  getTeachingClassRoster,
  getTeachingGradeRoster,
  summarizeTeachingModeWriteResults,
} from '../teachingModeUtils'
import { applyStudentClassAssignments } from '../dashboardData'

describe('buildLateToClassFields', () => {
  it('marks school attendance as late when a student arrives late to class from an absent state', () => {
    const result = buildLateToClassFields(
      {
        id: 7,
        dailyStatus: 'absent',
        status: 'absent',
        classLog: [],
      },
      {
        timeStr: '10:42',
        actingStaffName: 'Teacher A',
        note: 'Came late — was with Rabbi',
        staffId: null,
      },
    )

    expect(result.dailyStatus).toBe('late')
    expect(result.status).toBe('present')
    expect(result.lateDetails?.reason).toBe('late-to-class')
    expect(result.classLog).toHaveLength(1)
  })
})

describe('teaching mode write result helpers', () => {
  it('treats only explicit false as failed persistence', () => {
    expect(didTeachingModeWriteSucceed(true)).toBe(true)
    expect(didTeachingModeWriteSucceed(undefined)).toBe(true)
    expect(didTeachingModeWriteSucceed(null)).toBe(true)
    expect(didTeachingModeWriteSucceed(false)).toBe(false)
  })

  it('summarizes failed write counts for bulk actions', () => {
    const summary = summarizeTeachingModeWriteResults([true, false, undefined, false])
    expect(summary).toEqual({
      total: 4,
      failedCount: 2,
      allSucceeded: false,
    })
  })

  it('builds a clear user-facing failure summary message', () => {
    const message = buildTeachingModeWriteFailureMessage({ total: 6, failedCount: 2 })
    expect(message).toBe('Saved 4 of 6. 2 actions failed to persist.')
  })
})

describe('Teaching Mode authoritative roster and classroom attendance', () => {
  const classes = [
    { id: 'yk-a', grade: '8th Grade' },
    { id: 'yk-b', grade: '7th Grade' },
  ]
  const assignments = Object.fromEntries([
    ...Array.from({ length: 8 }, (_, index) => [index + 1, { classId: 'yk-b', divisionKey: 'yeshiva_ketana' }]),
    [9, { classId: 'yk-a', divisionKey: 'yeshiva_ketana' }],
  ])
  const schoolStudents = applyStudentClassAssignments(
    Array.from({ length: 9 }, (_, index) => ({ id: index + 1, name: `Student ${index + 1}`, is_active: true })),
    assignments,
  )

  it('expands five authorized 7th-grade students to the full eight-student assigned roster', () => {
    expect(getTeachingGradeRoster({
      schoolStudents,
      authorizedStudents: schoolStudents.slice(0, 5),
      selectedGrade: '7th Grade',
      classes,
    }).map(student => student.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])

    const movedToEighth = applyStudentClassAssignments(schoolStudents, { ...assignments, 8: { classId: 'yk-a', divisionKey: 'yeshiva_ketana' } })
    expect(getTeachingGradeRoster({
      schoolStudents: movedToEighth,
      authorizedStudents: movedToEighth.slice(0, 5),
      selectedGrade: '7th Grade',
      classes,
    }).map(student => student.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('expands an authorized class without duplicates and excludes archived students', () => {
    const archived = { ...schoolStudents[0], id: 10, is_active: false }
    expect(getTeachingClassRoster({
      schoolStudents: [...schoolStudents, schoolStudents[0], archived],
      authorizedStudents: schoolStudents.slice(0, 5),
      selectedClass: 'yk-b',
    }).map(student => student.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('does not infer classroom presence from daily school attendance', () => {
    const sessionKey = buildClassroomSessionKey({ date: new Date('2026-09-24T10:00:00'), scopeType: 'grade', scopeValue: '7th Grade', periodId: 2 })
    const schoolPresent = { id: 1, dailyStatus: 'present', status: 'present', classLog: [] }
    expect(getClassroomAttendanceStatus(schoolPresent, sessionKey)).toBe('unmarked')

    const fields = buildClassroomAttendanceFields(schoolPresent, { sessionKey, status: 'present', actingStaffName: 'Rabbi Cohen', recordedAt: '2026-09-24T10:00:00.000Z' })
    expect(fields).not.toHaveProperty('dailyStatus')
    expect(fields).not.toHaveProperty('status')
    expect(fields).not.toHaveProperty('lateDetails')
    expect(fields).not.toHaveProperty('departureDetails')
    const classroomPresent = { ...schoolPresent, ...fields }
    expect(getClassroomAttendanceStatus(classroomPresent, sessionKey)).toBe('present')
    expect(classroomPresent.dailyStatus).toBe('present')
    expect(classroomPresent.status).toBe('present')
    expect(getClassroomAttendanceStatus(classroomPresent, `${sessionKey}:other`)).toBe('unmarked')

    const cleared = { ...classroomPresent, ...buildClassroomAttendanceFields(classroomPresent, { sessionKey, status: 'unmarked', actingStaffName: 'Rabbi Cohen', recordedAt: '2026-09-24T10:05:00.000Z' }) }
    expect(getClassroomAttendanceStatus(cleared, sessionKey)).toBe('unmarked')
  })
})
