import { describe, expect, it } from 'vitest'
import { deduplicateStudentIds } from '../teachingModeUtils'

function buildScopedRoster(scopeType: string, selectedClass: string | null, selectedTeacher: string, selectedGrade: string, selectedPeriod: string, students: Array<{ id: number; name: string }>, studentClasses: Record<string, string>, classes: Array<{ id: string; teacher: string; grade: string }>, assignmentPeriods: Record<string, number[]>) {
  const byClass = (student: { id: number }, classId: string | null) => !classId ? true : studentClasses[student.id] === classId
  const byTeacher = (student: { id: number }, teacherName: string) => {
    const classId = studentClasses[student.id]
    const cls = classes.find(item => item.id === classId)
    return cls?.teacher === teacherName
  }
  const byGrade = (student: { id: number }, gradeName: string) => {
    const classId = studentClasses[student.id]
    const cls = classes.find(item => item.id === classId)
    return cls?.grade === gradeName
  }

  if (scopeType === 'class') {
    return students.filter(student => byClass(student, selectedClass))
  }

  if (scopeType === 'teacher') {
    return students.filter(student => byTeacher(student, selectedTeacher))
  }

  if (scopeType === 'grade') {
    return students.filter(student => byGrade(student, selectedGrade))
  }

  if (scopeType === 'period') {
    const periodSet = new Set((assignmentPeriods[selectedPeriod] || []).map(id => Number(id)))
    return students.filter(student => periodSet.has(Number(student.id)))
  }

  return students
}

describe('teaching mode roster scoping', () => {
  it('deduplicates student ids across period buckets', () => {
    expect(deduplicateStudentIds([1, 2, 2, 3, 1, 4])).toEqual([1, 2, 3, 4])
  })

  it('filters a teacher roster by class and preserves a clear classroom view', () => {
    const students = [
      { id: 1, name: 'Avi' },
      { id: 2, name: 'Beni' },
      { id: 3, name: 'Chaim' },
    ]
    const studentClasses = { 1: 'c1', 2: 'c2', 3: 'c1' }
    const classes = [
      { id: 'c1', teacher: 'Rabbi A', grade: '1' },
      { id: 'c2', teacher: 'Rabbi B', grade: '2' },
    ]

    const classScoped = buildScopedRoster('class', 'c1', '', '', '', students, studentClasses, classes, {})
    const teacherScoped = buildScopedRoster('teacher', null, 'Rabbi A', '', '', students, studentClasses, classes, {})

    expect(classScoped.map(student => student.id)).toEqual([1, 3])
    expect(teacherScoped.map(student => student.id)).toEqual([1, 3])
  })
})
