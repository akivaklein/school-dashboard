import { describe, expect, it } from 'vitest'
import { findInstructionalGroupConflict, getActiveTeacherStaff } from '../instructionalGroupUtils'

describe('instructional group conflicts', () => {
  const groups = [
    { id: 'morning-1', period_id: 'morning-p1', status: 'active' },
    { id: 'morning-2', period_id: 'morning-p1', status: 'active' },
    { id: 'afternoon-1', period_id: 'afternoon-p1', status: 'active' },
  ]
  const memberships = [
    { group_id: 'morning-1', student_id: 7 },
    { group_id: 'afternoon-1', student_id: 7 },
  ]

  it('allows the same student in different periods', () => {
    expect(findInstructionalGroupConflict([7], 'afternoon-p2', groups, memberships)).toBeNull()
  })

  it('blocks overlapping groups in the same period', () => {
    expect(findInstructionalGroupConflict([7], 'morning-p1', groups, memberships)).toBe(7)
  })
})

describe('instructional group teacher source', () => {
  it('uses active persisted teacher/rebbe roles, including multi-role staff', () => {
    expect(getActiveTeacherStaff([
      { name: 'Teacher', role: 'Teacher', roles: ['teacher'], active: true },
      { name: 'Admin Teacher', role: 'Admin + Teacher', roles: ['admin', 'teacher'], active: true },
      { name: 'Archived Rebbe', role: 'Rebbe', roles: ['rebbe'], active: false },
      { name: 'Support', role: 'Support Staff', roles: ['support_staff'], active: true },
    ]).map(member => member.name)).toEqual(['Teacher', 'Admin Teacher'])
  })
})
