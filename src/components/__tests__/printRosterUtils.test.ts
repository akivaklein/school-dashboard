import { describe, expect, it } from 'vitest'
import { getPrintableRoster, movePrintColumn } from '../printRosterUtils'

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
const instructionalGroups = []
const instructionalGroupMemberships = []

describe('getPrintableRoster', () => {
  it('moves printable columns in the requested direction without changing other entries', () => {
    expect(movePrintColumn(['On Time', 'Leaving', 'Notes'], 2, 0)).toEqual(['Notes', 'On Time', 'Leaving'])
    expect(movePrintColumn(['On Time', 'Leaving', 'Notes'], 0, -1)).toEqual(['On Time', 'Leaving', 'Notes'])
  })

  it('uses the existing class resolver and excludes archived students', () => {
    const roster = getPrintableRoster({ students, classes, scope: 'class', classId: 'yk-b', teacherName: '', additionalClassIdsByStudent: {}, instructionalGroups, instructionalGroupMemberships })

    expect(roster.map(student => student.id)).toEqual([2, 4])
  })

  it('uses student class assignments rather than teacher direct-student records', () => {
    const roster = getPrintableRoster({ students, classes, scope: 'teacher', classId: '', teacherName: 'Rabbi Cohen', teacherClassId: 'all', additionalClassIdsByStudent: {}, instructionalGroups, instructionalGroupMemberships })

    expect(roster.map(student => student.id)).toEqual([1])
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
    const memberships = [{ group_id: 'mishna', student_id: 10 }, { group_id: 'gemara', student_id: 11 }]

    expect(getPrintableRoster({ students: groupStudents, classes: groups, scope: 'teacher', classId: '', teacherName: 'Rabbi Cohen', teacherClassId: '', additionalClassIdsByStudent: {}, instructionalGroups: groups, instructionalGroupMemberships: memberships })).toEqual([])
    expect(getPrintableRoster({ students: groupStudents, classes: groups, scope: 'teacher', classId: '', teacherName: 'Rabbi Cohen', teacherClassId: 'mishna', additionalClassIdsByStudent: {}, instructionalGroups: groups, instructionalGroupMemberships: memberships }).map(student => student.id)).toEqual([10])
    expect(getPrintableRoster({ students: groupStudents, classes: groups, scope: 'teacher', classId: '', teacherName: 'Rabbi Cohen', teacherClassId: 'all', additionalClassIdsByStudent: {}, instructionalGroups: groups, instructionalGroupMemberships: memberships }).map(student => student.id)).toEqual([10, 11])
  })
})