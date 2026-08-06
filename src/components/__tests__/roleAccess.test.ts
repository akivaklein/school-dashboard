import { describe, expect, it } from 'vitest'
import { canAccessDashboardPage, canAccessStudentForRole, getTeacherAssignedStudentIds } from '../dashboardData'

describe('role access helpers', () => {
  it('blocks teachers from setup and leadership pages', () => {
    expect(canAccessDashboardPage('teacher', 'setup')).toBe(false)
    expect(canAccessDashboardPage('teacher', 'calls')).toBe(false)
    expect(canAccessDashboardPage('teacher', 'attendance')).toBe(true)
    expect(canAccessDashboardPage('teacher', 'messages')).toBe(true)
  })

  it('restricts teachers to assigned students', () => {
    const teacherStudent = { id: 42, name: 'Ari', className: 'K-1' }
    const otherStudent = { id: 77, name: 'Moshe', className: 'K-2' }

    expect(
      canAccessStudentForRole(teacherStudent, {
        role: 'teacher',
        userName: 'Rabbi Klein',
        setupAssignments: {
          'Rabbi Klein': {
            periods: { 1: [42], 2: [], 3: [] },
            caseload: [],
          },
        },
        students: [teacherStudent, otherStudent],
      }),
    ).toBe(true)

    expect(
      canAccessStudentForRole(otherStudent, {
        role: 'teacher',
        userName: 'Rabbi Klein',
        setupAssignments: {
          'Rabbi Klein': {
            periods: { 1: [42], 2: [], 3: [] },
            caseload: [],
          },
        },
        students: [teacherStudent, otherStudent],
      }),
    ).toBe(false)
  })

  it('keeps canteen scoped to store workflows only', () => {
    expect(canAccessDashboardPage('store', 'store')).toBe(true)
    expect(canAccessDashboardPage('store', 'teaching-mode')).toBe(false)
  })

  it('falls back to the class-map roster for Rabbi Klein when database assignments are empty', () => {
    const students = [
      { id: 201, name: 'Avi', className: 'Dargei Alef', classId: 'a' },
      { id: 202, name: 'Beni', className: 'Dargei Beis', classId: 'b' },
      { id: 203, name: 'Chaim', className: 'Dargei Alef', classId: 'a' },
    ]

    expect(getTeacherAssignedStudentIds('Rabbi Klein', {}, [], students)).toEqual([201, 203])
    expect(canAccessStudentForRole(students[0], {
      role: 'teacher',
      userName: 'Rabbi Klein',
      setupAssignments: {},
      students,
    })).toBe(true)
    expect(canAccessStudentForRole(students[1], {
      role: 'teacher',
      userName: 'Rabbi Klein',
      setupAssignments: {},
      students,
    })).toBe(false)
  })

  it('falls back to the class-map roster for another teacher when database assignments are empty', () => {
    const students = [
      { id: 301, name: 'Dovy', className: 'Dargei Beis', classId: 'b' },
      { id: 302, name: 'Eli', className: 'Dargei Gimmel', classId: 'c' },
      { id: 303, name: 'Fredi', className: 'Dargei Beis', classId: 'b' },
    ]

    expect(getTeacherAssignedStudentIds('Rabbi Goldstein', {}, [], students)).toEqual([301, 303])
    expect(canAccessStudentForRole(students[0], {
      role: 'teacher',
      userName: 'Rabbi Goldstein',
      setupAssignments: {},
      students,
    })).toBe(true)
    expect(canAccessStudentForRole(students[1], {
      role: 'teacher',
      userName: 'Rabbi Goldstein',
      setupAssignments: {},
      students,
    })).toBe(false)
  })

  it('supports explicit assignedStudentIds overrides for live role scoping checks', () => {
    const teacherStudent = { id: 42, name: 'Ari', className: 'K-1' }
    const otherStudent = { id: 77, name: 'Moshe', className: 'K-2' }

    expect(
      canAccessStudentForRole(teacherStudent, {
        role: 'teacher',
        userName: 'Rabbi Klein',
        assignedStudentIds: [42],
        setupAssignments: {},
        students: [teacherStudent, otherStudent],
      }),
    ).toBe(true)

    expect(
      canAccessStudentForRole(otherStudent, {
        role: 'teacher',
        userName: 'Rabbi Klein',
        assignedStudentIds: [42],
        setupAssignments: {},
        students: [teacherStudent, otherStudent],
      }),
    ).toBe(false)
  })
})
