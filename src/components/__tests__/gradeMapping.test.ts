import { describe, expect, it } from 'vitest'
import {
  CLASSES,
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

  it('prefers the stored grade over legacy class names', () => {
    expect(resolveStudentGrade({ id: 900, grade: '7', class_name: 'Yeshiva Ketana Alef' })).toBe('7')
    expect(resolveStudentGrade({ id: 901, class_name: 'Yeshiva Ketana Beis' })).toBe('7')
    expect(resolveStudentGrade({ id: 902, class_name: '8th Grade' })).toBe('8')
  })

  it('resolves a class id from grade alone', () => {
    expect(resolveStudentClassId({ id: 903, grade: '8' })).toBe('yk-a')
    expect(resolveStudentClassId({ id: 904, grade: '7' })).toBe('yk-b')
  })

  it('treats 7th and 8th graders as Yeshiva Ketana students', () => {
    expect(isYeshivaKetanaStudent({ id: 905, grade: '8' })).toBe(true)
    expect(isYeshivaKetanaStudent({ id: 906, class_name: '7th Grade' })).toBe(true)
    expect(isYeshivaKetanaStudent({ id: 907, class_name: 'Some Other Class' })).toBe(false)
  })

  it('combines primary class with additional class memberships without duplicates', () => {
    const student = { id: 908, grade: '8' }
    expect(resolveStudentClassIds(student)).toEqual(['yk-a'])
    expect(resolveStudentClassIds(student, { 908: ['gemara-level-2', 'yk-a'] })).toEqual(['yk-a', 'gemara-level-2'])
  })

  it('reports whether a student belongs to a given class across primary + additional memberships', () => {
    const student = { id: 909, grade: '7' }
    const additional = { 909: ['math-group-b'] }
    expect(studentBelongsToClass(student, 'all', additional)).toBe(true)
    expect(studentBelongsToClass(student, 'yk-b', additional)).toBe(true)
    expect(studentBelongsToClass(student, 'math-group-b', additional)).toBe(true)
    expect(studentBelongsToClass(student, 'yk-a', additional)).toBe(false)
  })
})
