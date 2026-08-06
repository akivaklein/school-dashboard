import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

const { clearStudentFallbackPatchMock, mergeStudentFallbackPatchMock } = vi.hoisted(() => ({
  clearStudentFallbackPatchMock: vi.fn(),
  mergeStudentFallbackPatchMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

vi.mock('../../utils/studentFallbackCache', () => ({
  clearStudentFallbackPatch: clearStudentFallbackPatchMock,
  mergeStudentFallbackPatch: mergeStudentFallbackPatchMock,
}))

import { persistStudentFields } from '../studentPersistenceService'

describe('persistStudentFields', () => {
  beforeEach(() => {
    fromMock.mockReset()
    clearStudentFallbackPatchMock.mockReset()
    mergeStudentFallbackPatchMock.mockReset()
  })

  it('maps therapist assignment fields to student table column names', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    fromMock.mockReturnValue({ update: updateMock })

    const result = await persistStudentFields(6, {
      therapyAssignments: [
        {
          id: 'therapy-6-1',
          provider: 'Yitzi Liebowitz',
          serviceType: 'Speech',
          day: 'Monday',
          date: '',
          startTime: '10:10',
          endTime: '10:55',
          recurrence: 'Weekly',
          customDays: [],
          affectedPeriod: 'Period 1',
          notes: 'Reading pullout',
          active: true,
        },
      ],
      assignedTherapist: 'Yitzi Liebowitz',
      therapyFrequency: 'Weekly',
      therapyNotes: 'Reading pullout',
    })

    expect(result).toBe(true)
    expect(clearStudentFallbackPatchMock).toHaveBeenCalledWith(6)
    expect(mergeStudentFallbackPatchMock).not.toHaveBeenCalled()
    expect(fromMock).toHaveBeenCalledWith('students')
    expect(updateMock).toHaveBeenCalledWith({
      therapy_assignments: [
        {
          id: 'therapy-6-1',
          provider: 'Yitzi Liebowitz',
          serviceType: 'Speech',
          day: 'Monday',
          date: '',
          startTime: '10:10',
          endTime: '10:55',
          recurrence: 'Weekly',
          customDays: [],
          affectedPeriod: 'Period 1',
          notes: 'Reading pullout',
          active: true,
        },
      ],
      assigned_therapist: 'Yitzi Liebowitz',
      therapy_frequency: 'Weekly',
      therapy_notes: 'Reading pullout',
    })
    expect(eqMock).toHaveBeenCalledWith('id', 6)
  })

  it('drops unknown therapist assignment columns and retries save', async () => {
    const eqMock = vi
      .fn()
      .mockResolvedValueOnce({
        error: {
          message: 'column "therapy_assignments" of relation "students" does not exist',
        },
      })
      .mockResolvedValueOnce({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    fromMock.mockReturnValue({ update: updateMock })

    const result = await persistStudentFields(9, {
      therapyAssignments: [{ id: 'therapy-9-1' }],
      therapyNotes: 'Fallback should keep this write',
    })

    expect(result).toBe(true)
    expect(clearStudentFallbackPatchMock).toHaveBeenCalledWith(9)
    expect(mergeStudentFallbackPatchMock).not.toHaveBeenCalled()
    expect(updateMock).toHaveBeenCalledTimes(2)
    expect(updateMock).toHaveBeenNthCalledWith(1, {
      therapy_assignments: [{ id: 'therapy-9-1' }],
      therapy_notes: 'Fallback should keep this write',
    })
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      therapy_notes: 'Fallback should keep this write',
    })
  })

  it('stores fallback patch when save fails', async () => {
    const dbError = { message: 'network timeout' }
    const eqMock = vi.fn().mockResolvedValue({ error: dbError })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    fromMock.mockReturnValue({ update: updateMock })

    const fields = {
      therapyAssignments: [{ id: 'therapy-12-1' }],
      therapyNotes: 'Save this in fallback cache',
    }

    const result = await persistStudentFields(12, fields)

    expect(result).toBe(false)
    expect(clearStudentFallbackPatchMock).not.toHaveBeenCalled()
    expect(mergeStudentFallbackPatchMock).toHaveBeenCalledWith(12, fields)
  })
})
