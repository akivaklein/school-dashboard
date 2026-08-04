import { describe, expect, it } from 'vitest'
import {
  buildLateToClassFields,
  buildTeachingModeWriteFailureMessage,
  didTeachingModeWriteSucceed,
  summarizeTeachingModeWriteResults,
} from '../teachingModeUtils'

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

describe('teaching mode write result helpers', () => {
  it('treats only explicit false as failed persistence', () => {
    expect(didTeachingModeWriteSucceed(true)).toBe(true)
    expect(didTeachingModeWriteSucceed(undefined)).toBe(true)
    expect(didTeachingModeWriteSucceed(null)).toBe(true)
    expect(didTeachingModeWriteSucceed(false)).toBe(false)
  })

  it('summarizes failed write counts for bulk actions', () => {
    const summary = summarizeTeachingModeWriteResults([true, false, undefined, false])
    expect(summary).toEqual({
      total: 4,
      failedCount: 2,
      allSucceeded: false,
    })
  })

  it('builds a clear user-facing failure summary message', () => {
    const message = buildTeachingModeWriteFailureMessage({ total: 6, failedCount: 2 })
    expect(message).toBe('Saved 4 of 6. 2 actions failed to persist.')
  })
})
