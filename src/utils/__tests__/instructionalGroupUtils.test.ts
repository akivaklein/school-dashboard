import { describe, expect, it } from 'vitest'
import {
  findInstructionalGroupConflict,
  getActiveTeacherStaff,
  getCurrentInstructionalPeriod,
  getInstructionalGroupStudentIds,
  getStudentInstructionalGroup,
  matchesClassAssignmentFilter,
} from '../instructionalGroupUtils'

describe('shared instructional schedule resolution', () => {
  const periods = [
    { id: 'morning-p1', start_time: '', end_time: '10:00', sort_order: 1, status: 'active' },
    { id: 'afternoon-p1', start_time: '13:20', end_time: '14:00', sort_order: 4, status: 'active' },
  ]

  it('does not invent a start time for an incomplete morning period', () => {
    expect(getCurrentInstructionalPeriod(periods, new Date(2026, 8, 9, 9, 30))).toBeNull()
  })

  it('resolves configured Monday through Thursday periods only', () => {
    expect(getCurrentInstructionalPeriod(periods, new Date(2026, 8, 9, 13, 40))?.id).toBe('afternoon-p1')
    expect(getCurrentInstructionalPeriod(periods, new Date(2026, 8, 11, 13, 40))).toBeNull()
  })

  it('resolves a student and roster from period-specific memberships', () => {
    const groups = [
      { id: 'math-a', period_id: 'afternoon-p1', status: 'active' },
      { id: 'reading-b', period_id: 'afternoon-p2', status: 'active' },
    ]
    const memberships = [
      { group_id: 'math-a', student_id: 7 },
      { group_id: 'math-a', student_id: 8 },
      { group_id: 'reading-b', student_id: 7 },
    ]

    expect(getStudentInstructionalGroup(7, 'afternoon-p1', groups, memberships)?.id).toBe('math-a')
    expect(getInstructionalGroupStudentIds('math-a', memberships)).toEqual([7, 8])
  })

  it('filters Student Class Assignments by homeroom or persisted group membership', () => {
    const memberships = [
      { group_id: 'math-a', student_id: 7 },
      { group_id: 'reading-b', student_id: 7 },
      { group_id: 'math-a', student_id: 8 },
    ]

    expect(matchesClassAssignmentFilter(7, 'grade-8', 'all', memberships)).toBe(true)
    expect(matchesClassAssignmentFilter(7, 'grade-8', 'homeroom:grade-8', memberships)).toBe(true)
    expect(matchesClassAssignmentFilter(7, 'grade-8', 'homeroom:grade-7', memberships)).toBe(false)
    expect(matchesClassAssignmentFilter(7, 'grade-8', 'group:math-a', memberships)).toBe(true)
    expect(matchesClassAssignmentFilter(7, 'grade-8', 'group:reading-b', memberships)).toBe(true)
    expect(matchesClassAssignmentFilter(8, 'grade-7', 'group:reading-b', memberships)).toBe(false)
  })
})

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
