import { describe, expect, it } from 'vitest'
import { canAccessDashboardPage, canAccessStudentForRole } from '../dashboardData'

describe('role access helpers', () => {
  it('blocks removed intake page for all roles', () => {
    expect(canAccessDashboardPage('admin', 'intake')).toBe(false)
    expect(canAccessDashboardPage('teacher', 'intake')).toBe(false)
    expect(canAccessDashboardPage('support_staff', 'intake')).toBe(false)
  })

  it('allows normal staff through the secure site while keeping Register restricted', () => {
    expect(canAccessDashboardPage('teacher', 'setup')).toBe(true)
    expect(canAccessDashboardPage('teacher', 'staff-directory')).toBe(true)
    expect(canAccessDashboardPage('teacher', 'teaching-mode')).toBe(true)
    expect(canAccessDashboardPage('teacher', 'students')).toBe(true)
    expect(canAccessDashboardPage('teacher', 'store')).toBe(true)
    expect(canAccessDashboardPage('register', 'setup')).toBe(false)
    expect(canAccessDashboardPage('register', 'store')).toBe(true)
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

  it('allows support staff through the secure site', () => {
    expect(canAccessDashboardPage('support_staff', 'setup')).toBe(true)
    expect(canAccessDashboardPage('support_staff', 'staff-directory')).toBe(true)
    expect(canAccessDashboardPage('support_staff', 'behavior')).toBe(true)
    expect(canAccessDashboardPage('support_staff', 'store')).toBe(true)
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
