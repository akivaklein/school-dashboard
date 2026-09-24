import { describe, expect, it } from 'vitest'
import {
  applyStudentClassAssignments,
  CLASSES,
  getTeacherAssignedClassIds,
  isYeshivaKetanaStudent,
  normalizeGradeValue,
  resolveStudentClassId,
  resolveStudentClassIds,
  resolveStudentGrade,
  studentBelongsToClass,
} from '../dashboardData'

describe('Yeshiva Ketana grade mapping', () => {
  it('exposes only 8th/7th Grade class labels', () => {
    expect(CLASSES.map(cls => cls.name)).toEqual(['8th Grade', '7th Grade'])
    expect(JSON.stringify(CLASSES)).not.toMatch(/alef|beis/i)
  })

  it('maps legacy Alef/Beis labels to 8 and 7', () => {
    expect(normalizeGradeValue('Yeshiva Ketana Alef')).toBe('8')
    expect(normalizeGradeValue('Yeshiva Ketana Beis')).toBe('7')
    expect(normalizeGradeValue('8th Grade')).toBe('8')
    expect(normalizeGradeValue('7th Grade')).toBe('7')
    expect(normalizeGradeValue('')).toBe('')
  })

  it('does not derive active grade or class from legacy student fields', () => {
    const legacyStudent = { id: 900, grade: '7', class_id: 'yk-b', class_name: '7th Grade' }
    expect(resolveStudentGrade(legacyStudent)).toBe('')
    expect(resolveStudentClassId(legacyStudent)).toBeNull()
  })

  it('projects Student Class Assignments as the only active class source', () => {
    const students = [{ id: 903, grade: '7', class_id: 'legacy-class', class_name: 'Legacy Class' }]
    const [eighthGrade] = applyStudentClassAssignments(students, { 903: { classId: 'yk-a', divisionKey: 'yeshiva_ketana' } })
    const [seventhGrade] = applyStudentClassAssignments(students, { 903: { classId: 'yk-b', divisionKey: 'yeshiva_ketana' } })

    expect(resolveStudentClassId(eighthGrade)).toBe('yk-a')
    expect(resolveStudentGrade(eighthGrade)).toBe('8')
    expect(eighthGrade.className).toBe('8th Grade')
    expect(resolveStudentClassId(seventhGrade)).toBe('yk-b')
    expect(resolveStudentGrade(seventhGrade)).toBe('7')
    expect(seventhGrade.className).toBe('7th Grade')
  })

  it('moves a teacher-assigned student from 8th to 7th without changing the staff assignment', () => {
    const staffAssignments = {
      'Rabbi Cohen': { periods: { 1: [903], 2: [], 3: [] }, caseload: [] },
    }
    const [eighthGrade] = applyStudentClassAssignments([{ id: 903, is_active: true }], { 903: { classId: 'yk-a', divisionKey: 'yeshiva_ketana' } })
    const [seventhGrade] = applyStudentClassAssignments([{ id: 903, is_active: true }], { 903: { classId: 'yk-b', divisionKey: 'yeshiva_ketana' } })

    expect(getTeacherAssignedClassIds('Rabbi Cohen', staffAssignments, [eighthGrade])).toEqual(['yk-a'])
    expect(getTeacherAssignedClassIds('Rabbi Cohen', staffAssignments, [seventhGrade])).toEqual(['yk-b'])
    expect(staffAssignments['Rabbi Cohen'].periods[1]).toEqual([903])
  })

  it('treats 7th and 8th graders as Yeshiva Ketana students', () => {
    const projected = applyStudentClassAssignments([{ id: 905 }, { id: 906 }, { id: 907 }], {
      905: { classId: 'yk-a', divisionKey: 'yeshiva_ketana' },
      906: { classId: 'yk-b', divisionKey: 'yeshiva_ketana' },
    })
    expect(isYeshivaKetanaStudent(projected[0])).toBe(true)
    expect(isYeshivaKetanaStudent(projected[1])).toBe(true)
    expect(isYeshivaKetanaStudent(projected[2])).toBe(false)
  })

  it('combines primary class with additional class memberships without duplicates', () => {
    const [student] = applyStudentClassAssignments([{ id: 908 }], { 908: { classId: 'yk-a', divisionKey: 'yeshiva_ketana' } })
    expect(resolveStudentClassIds(student)).toEqual(['yk-a'])
    expect(resolveStudentClassIds(student, { 908: ['gemara-level-2', 'yk-a', 'yk-b'] })).toEqual(['yk-a', 'gemara-level-2'])
  })

  it('reports whether a student belongs to a given class across primary + additional memberships', () => {
    const [student] = applyStudentClassAssignments([{ id: 909 }], { 909: { classId: 'yk-b', divisionKey: 'yeshiva_ketana' } })
    const additional = { 909: ['math-group-b'] }
    expect(studentBelongsToClass(student, 'all', additional)).toBe(true)
    expect(studentBelongsToClass(student, 'yk-b', additional)).toBe(true)
    expect(studentBelongsToClass(student, 'math-group-b', additional)).toBe(true)
    expect(studentBelongsToClass(student, 'yk-a', additional)).toBe(false)
  })
})
