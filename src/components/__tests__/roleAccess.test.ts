import { describe, expect, it } from 'vitest'
import { canAccessDashboardPage, canAccessStudentForRole } from '../dashboardData'

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
