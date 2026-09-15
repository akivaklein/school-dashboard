import { describe, expect, it } from 'vitest'
import { getPrintableRoster } from '../printRosterUtils'

const classes = [
  { id: 'yk-a', name: '8th Grade', teacher: 'Rabbi Cohen' },
  { id: 'yk-b', name: '7th Grade', teacher: 'Rabbi Levi' },
]
const students = [
  { id: 1, name: 'Avi', grade: '8', is_active: true },
  { id: 2, name: 'Binyamin', grade: '7', is_active: true },
  { id: 3, name: 'Chaim', grade: '7', is_active: false },
  { id: 4, name: 'Dovid', grade: '7', is_active: true },
]
const teacherAssignments = new Map([['rabbi cohen', new Set([4])]])

describe('getPrintableRoster', () => {
  it('uses the existing class resolver and excludes archived students', () => {
    const roster = getPrintableRoster({ students, classes, scope: 'class', classId: 'yk-b', teacherName: '', setupAssignments: {}, additionalClassIdsByStudent: {}, teacherAssignedStudentIdsByName: teacherAssignments })

    expect(roster.map(student => student.id)).toEqual([2, 4])
  })

  it('uses the existing teacher class and direct-student assignments', () => {
    const roster = getPrintableRoster({ students, classes, scope: 'teacher', classId: '', teacherName: 'Rabbi Cohen', teacherClassId: 'all', setupAssignments: {}, additionalClassIdsByStudent: {}, teacherAssignedStudentIdsByName: teacherAssignments })

    expect(roster.map(student => student.id)).toEqual([1, 4])
  })

  it('keeps a teacher’s groups separate until All classes is explicitly selected', () => {
    const groups = [
      { id: 'mishna', name: 'Mishna', teacher: 'Rabbi Cohen' },
      { id: 'gemara', name: 'Gemara', teacher: 'Rabbi Cohen' },
    ]
    const groupStudents = [
      { id: 10, name: 'Eli', is_active: true },
      { id: 11, name: 'Fischl', is_active: true },
    ]
    const memberships = { 10: ['mishna'], 11: ['gemara'] }

    expect(getPrintableRoster({ students: groupStudents, classes: groups, scope: 'teacher', classId: '', teacherName: 'Rabbi Cohen', teacherClassId: '', setupAssignments: {}, additionalClassIdsByStudent: memberships, teacherAssignedStudentIdsByName: new Map() })).toEqual([])
    expect(getPrintableRoster({ students: groupStudents, classes: groups, scope: 'teacher', classId: '', teacherName: 'Rabbi Cohen', teacherClassId: 'mishna', setupAssignments: {}, additionalClassIdsByStudent: memberships, teacherAssignedStudentIdsByName: new Map() }).map(student => student.id)).toEqual([10])
    expect(getPrintableRoster({ students: groupStudents, classes: groups, scope: 'teacher', classId: '', teacherName: 'Rabbi Cohen', teacherClassId: 'all', setupAssignments: {}, additionalClassIdsByStudent: memberships, teacherAssignedStudentIdsByName: new Map() }).map(student => student.id)).toEqual([10, 11])
  })
})