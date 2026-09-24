import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { createStudentRecord, normalizeStudentGrade, updateStudentRecord } from '../studentsAdminService'

describe('studentsAdminService', () => {
  beforeEach(() => {
    fromMock.mockReset()
    vi.restoreAllMocks()
  })

  it('normalizes Yeshiva Ketana grades from class names and explicit values', () => {
    expect(normalizeStudentGrade('7')).toBe('7')
    expect(normalizeStudentGrade('8')).toBe('8')
    expect(normalizeStudentGrade('Yeshiva Ketana Alef')).toBe('8')
    expect(normalizeStudentGrade('Yeshiva Ketana Beis')).toBe('7')
    expect(normalizeStudentGrade('Grade 8')).toBe('8')
    expect(normalizeStudentGrade('7th Grade')).toBe('7')
    expect(normalizeStudentGrade('8th Grade')).toBe('8')
  })

  it('derives class_name from grade so class and grade cannot contradict', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const selectMock = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 13 }, error: null }) })
    const insertMock = vi.fn().mockReturnValue({ select: selectMock })
    fromMock.mockReturnValue({ insert: insertMock, update: vi.fn().mockReturnValue({ eq: eqMock }) })

    await createStudentRecord({ name: 'Yaakov', className: 'Yeshiva Ketana Beis', grade: '7' }, 'Admin User')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ class_name: '7th Grade', grade: '7' }),
    )
  })

  it('stores grade as 7 or 8 for Yeshiva Ketana student creation', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const selectMock = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 12 }, error: null }) })
    const insertMock = vi.fn().mockReturnValue({ select: selectMock })
    fromMock.mockReturnValue({ insert: insertMock, update: vi.fn().mockReturnValue({ eq: eqMock }) })

    const result = await createStudentRecord({
      name: 'Moshe',
      className: 'Yeshiva Ketana Alef',
      grade: '8',
      teacherAssignments: ['Rabbi Klein'],
      supportAssignments: ['Ms. Jones'],
      family: { fatherName: 'A', motherName: 'B', fatherPhone: '1', motherPhone: '2', address: 'C' },
      isActive: true,
    }, 'Admin User')

    expect(result.id).toBe(12)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        class_name: '8th Grade',
        grade: '8',
        is_active: true,
      }),
    )
  })

  it('does not overwrite legacy class fields during a general student edit', async () => {
    const updatedRow = { id: 12, name: 'Moshe Updated', class_name: '8th Grade', grade: '8' }
    const singleMock = vi.fn().mockResolvedValue({ data: updatedRow, error: null })
    const selectMock = vi.fn().mockReturnValue({ single: singleMock })
    const eqMock = vi.fn().mockReturnValue({ select: selectMock })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    fromMock.mockReturnValue({ update: updateMock, insert: vi.fn().mockResolvedValue({ error: null }) })

    await updateStudentRecord(12, { name: 'Moshe Updated', className: '7th Grade', classId: 'yk-b', grade: '7' }, 'Admin User')

    const patch = updateMock.mock.calls[0][0]
    expect(patch).not.toHaveProperty('class_name')
    expect(patch).not.toHaveProperty('class_id')
    expect(patch).not.toHaveProperty('grade')
  })
})
