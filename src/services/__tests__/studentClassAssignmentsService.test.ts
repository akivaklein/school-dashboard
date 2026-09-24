import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('../../supabaseClient', () => ({
  supabase: { from: fromMock },
}))

import { loadStudentClassAssignments, upsertStudentClassAssignment, upsertStudentClassAssignmentBatch } from '../gradeEntriesService'

describe('Student Class Assignments persistence', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('moves a student by upserting the same student_id row', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    fromMock.mockReturnValue({ upsert })

    await expect(upsertStudentClassAssignment(42, 'yk-b', 'yeshiva_ketana', 'Admin')).resolves.toBe(true)

    expect(fromMock).toHaveBeenCalledWith('student_class_assignments')
    expect(upsert).toHaveBeenCalledWith(
      { student_id: 42, class_id: 'yk-b', division_key: 'yeshiva_ketana', updated_by: 'Admin' },
      { onConflict: 'student_id' },
    )
  })

  it('uses the same unique student_id key for batch moves', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    fromMock.mockReturnValue({ upsert })

    await expect(upsertStudentClassAssignmentBatch([
      { studentId: 42, classId: 'yk-a', divisionKey: 'yeshiva_ketana', updatedBy: 'Admin' },
      { studentId: 43, classId: 'yk-b', divisionKey: 'yeshiva_ketana', updatedBy: 'Admin' },
    ])).resolves.toBe(true)

    expect(upsert).toHaveBeenCalledWith([
      { student_id: 42, class_id: 'yk-a', division_key: 'yeshiva_ketana', updated_by: 'Admin' },
      { student_id: 43, class_id: 'yk-b', division_key: 'yeshiva_ketana', updated_by: 'Admin' },
    ], { onConflict: 'student_id' })
  })

  it('does not treat an assignment query failure as an empty valid roster', async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: { message: 'network unavailable' } })
    fromMock.mockReturnValue({ select })

    await expect(loadStudentClassAssignments()).rejects.toThrow('network unavailable')
  })
})