import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { buildTeacherRebbeAssignmentId, upsertTeacherRebbeAssignment } from '../setupCenterService'

describe('teacher/rebbe assignment persistence', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('generates distinct ids for primary and additional assignments', () => {
    const baseInput = {
      studentId: 42,
      teacherName: 'Rabbi Klein',
      subject: 'Chumash',
      classOrGroup: 'Boys 1',
      period: 'Period 1',
    }

    expect(buildTeacherRebbeAssignmentId({ ...baseInput, assignmentType: 'primary' })).not.toBe(
      buildTeacherRebbeAssignmentId({ ...baseInput, assignmentType: 'additional' }),
    )
  })

  it('persists assignment type and defaults weekdays when upserting', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: 'tra-42-rabbi-klein-chumash-boys-1-period-1-additional',
        student_id: 42,
        teacher_name: 'Rabbi Klein',
        subject: 'Chumash',
        class_or_group: 'Boys 1',
        period: 'Period 1',
        weekdays: ['Monday', 'Tuesday'],
        start_date: null,
        end_date: null,
        assignment_type: 'additional',
        status: 'active',
        updated_by: 'Admin',
      },
      error: null,
    })
    const selectMock = vi.fn().mockReturnValue({ single: singleMock })
    const upsertMock = vi.fn().mockReturnValue({ select: selectMock })
    fromMock.mockReturnValue({ upsert: upsertMock })

    const result = await upsertTeacherRebbeAssignment({
      student_id: 42,
      teacher_name: 'Rabbi Klein',
      subject: 'Chumash',
      class_or_group: 'Boys 1',
      period: 'Period 1',
      assignment_type: 'additional',
      updated_by: 'Admin',
    })

    expect(result).toMatchObject({
      id: 'tra-42-rabbi-klein-chumash-boys-1-period-1-additional',
      assignment_type: 'additional',
      status: 'active',
    })
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tra-42-rabbi-klein-chumash-boys-1-period-1-additional',
        assignment_type: 'additional',
        weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        updated_by: 'Admin',
      }),
      { onConflict: 'id' },
    )
  })
})