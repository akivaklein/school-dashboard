import { describe, expect, it } from 'vitest'
import {
  applyStudentClassAssignments,
  buildClassroomCoverageSnapshot,
  getTeacherAssignedClassIds,
  resolveStudentClassId,
  studentBelongsToClass,
} from '../dashboardData'
import { buildAttendanceReportRows } from '../dashboardData'
import { getPrintableRoster } from '../printRosterUtils'

const classes = [
  { id: 'yk-a', name: '8th Grade', grade: '8th Grade', teacher: 'Rabbi Cohen' },
  { id: 'yk-b', name: '7th Grade', grade: '7th Grade', teacher: 'Rabbi Levi' },
]
const rawStudent = {
  id: 42,
  name: 'Test Student',
  is_active: true,
  class_id: 'yk-a',
  class_name: '8th Grade',
  grade: '8',
  dailyStatus: 'present',
  status: 'present',
  classLog: [],
}
const staffAssignments = {
  'Rabbi Cohen': { periods: { 1: [42], 2: [], 3: [] }, caseload: [] },
}

function project(classId: 'yk-a' | 'yk-b', isActive = true) {
  return applyStudentClassAssignments(
    [{ ...rawStudent, is_active: isActive }],
    { 42: { classId, divisionKey: 'yeshiva_ketana' } },
    classes,
  )[0]
}

describe('Student Class Assignment propagation', () => {
  it('moves one student from 8th to 7th across class-aware consumers without duplication', () => {
    const eighthGrade = project('yk-a')
    const seventhGrade = project('yk-b')

    expect(resolveStudentClassId(eighthGrade)).toBe('yk-a')
    expect(eighthGrade.className).toBe('8th Grade')
    expect(resolveStudentClassId(seventhGrade)).toBe('yk-b')
    expect(seventhGrade.className).toBe('7th Grade')

    expect(studentBelongsToClass(seventhGrade, 'yk-a', { 42: ['yk-a', 'yk-b'] })).toBe(false)
    expect(studentBelongsToClass(seventhGrade, 'yk-b', { 42: ['yk-a', 'yk-b'] })).toBe(true)
    expect(buildClassroomCoverageSnapshot([seventhGrade], 'yk-a').expectedCount).toBe(0)
    expect(buildClassroomCoverageSnapshot([seventhGrade], 'yk-b').expectedCount).toBe(1)

    const printInput = {
      students: [seventhGrade],
      classes,
      scope: 'class' as const,
      teacherName: '',
      primaryClassIdsByStudent: { 42: 'yk-b' },
      additionalClassIdsByStudent: { 42: ['yk-a', 'yk-b'] },
      instructionalGroups: [],
      instructionalGroupMemberships: [],
    }
    expect(getPrintableRoster({ ...printInput, classId: 'yk-a' })).toEqual([])
    expect(getPrintableRoster({ ...printInput, classId: 'yk-b' }).map(student => student.id)).toEqual([42])
    expect(buildAttendanceReportRows([seventhGrade])[0].className).toBe('7th Grade')
    expect(getTeacherAssignedClassIds('Rabbi Cohen', staffAssignments, [seventhGrade])).toEqual(['yk-b'])
    expect(staffAssignments['Rabbi Cohen'].periods[1]).toEqual([42])
  })

  it('keeps archived students out of classroom and print rosters', () => {
    const archivedStudent = project('yk-b', false)
    expect(buildClassroomCoverageSnapshot([archivedStudent], 'yk-b').expectedCount).toBe(0)
    expect(getPrintableRoster({
      students: [archivedStudent],
      classes,
      scope: 'class',
      classId: 'yk-b',
      teacherName: '',
      primaryClassIdsByStudent: { 42: 'yk-b' },
      additionalClassIdsByStudent: {},
      instructionalGroups: [],
      instructionalGroupMemberships: [],
    })).toEqual([])
  })
})