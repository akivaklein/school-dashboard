import { describe, expect, it } from 'vitest'
import { buildLateToClassFields } from '../teachingModeUtils'

describe('buildLateToClassFields', () => {
  it('marks school attendance as late when a student arrives late to class from an absent state', () => {
    const result = buildLateToClassFields(
      {
        id: 7,
        dailyStatus: 'absent',
        status: 'absent',
        classLog: [],
      },
      {
        timeStr: '10:42',
        actingStaffName: 'Teacher A',
        note: 'Came late — was with Rabbi',
        staffId: null,
      },
    )

    expect(result.dailyStatus).toBe('late')
    expect(result.status).toBe('present')
    expect(result.lateDetails?.reason).toBe('late-to-class')
    expect(result.classLog).toHaveLength(1)
  })
})
