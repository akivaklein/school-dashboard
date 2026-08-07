import { describe, expect, it } from 'vitest'
import { canAccessDashboardPage, canAccessStudentForRole } from '../dashboardData'

describe('role access helpers', () => {
  it('blocks removed intake page for all roles', () => {
    expect(canAccessDashboardPage('admin', 'intake')).toBe(false)
    expect(canAccessDashboardPage('teacher', 'intake')).toBe(false)
    expect(canAccessDashboardPage('support_staff', 'intake')).toBe(false)
  })

  it('blocks teachers from setup and leadership pages', () => {
    expect(canAccessDashboardPage('teacher', 'setup')).toBe(false)
    expect(canAccessDashboardPage('teacher', 'calls')).toBe(false)
    expect(canAccessDashboardPage('teacher', 'students')).toBe(true)
    expect(canAccessDashboardPage('teacher', 'store')).toBe(true)
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

  it('scopes support staff to support pages', () => {
    expect(canAccessDashboardPage('support_staff', 'support')).toBe(true)
    expect(canAccessDashboardPage('support_staff', 'store')).toBe(false)
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
