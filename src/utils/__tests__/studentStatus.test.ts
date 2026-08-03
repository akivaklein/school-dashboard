import { describe, expect, it } from 'vitest'
import { endSessionStudentFields } from '../studentStatus'

describe('endSessionStudentFields', () => {
  it('restores a student to a present state when returning to class', () => {
    expect(endSessionStudentFields('back-in-class')).toEqual({
      status: 'present',
      dailyStatus: 'present',
      withStaff: null,
    })
  })

  it('marks a student as left early when dismissed', () => {
    expect(endSessionStudentFields('dismissed')).toEqual({
      status: 'left-early',
      dailyStatus: 'left-early',
      withStaff: null,
    })
  })
})
