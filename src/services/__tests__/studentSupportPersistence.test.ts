import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock, getSessionMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getSessionMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
    auth: { getSession: getSessionMock },
    supabaseUrl: 'https://project.supabase.co',
  },
}))

import { createStudentGoal, listStudentGoals, updateStudentGoal } from '../studentGoalsService'
import { createStudentNote, listStudentNotesForStudents } from '../studentNotesService'

describe('student support persistence', () => {
  beforeEach(() => {
    fromMock.mockReset()
    getSessionMock.mockReset()
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'redacted-test-token' } }, error: null })
  })

  it('stores structured observation metadata on student notes', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 10,
        student_id: 4,
        student_name: 'Ari',
        note: 'Worked independently for ten minutes.',
        author: 'Rabbi Klein',
        created_at: '2026-09-07T10:20:00Z',
        metadata: {
          supportType: 'observation',
          observationCategory: 'Academic',
          followUpNeeded: true,
          relatedGoalId: 'goal-1',
        },
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    fromMock.mockReturnValue({ insert })

    await createStudentNote({
      studentId: 4,
      studentName: 'Ari',
      note: 'Worked independently for ten minutes.',
      author: 'Rabbi Klein',
      actorName: 'Rabbi Klein',
      metadata: {
        supportType: 'observation',
        observationCategory: 'Academic',
        followUpNeeded: true,
        relatedGoalId: 'goal-1',
      },
    })

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        student_id: 4,
        note: 'Worked independently for ten minutes.',
        metadata: expect.objectContaining({
          supportType: 'observation',
          observationCategory: 'Academic',
          followUpNeeded: true,
          relatedGoalId: 'goal-1',
        }),
      }),
    ])
  })

  it('does not save observations as generic notes when metadata cannot be stored', async () => {
    const primarySingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST204', message: 'Could not find the metadata column of student_notes in the schema cache' },
    })
    const primarySelect = vi.fn().mockReturnValue({ single: primarySingle })
    const primaryInsert = vi.fn().mockReturnValue({ select: primarySelect })
    fromMock.mockReturnValue({ insert: primaryInsert })

    await expect(createStudentNote({
      studentId: 4,
      studentName: 'Ari',
      note: 'Worked independently for ten minutes.',
      author: 'Rabbi Klein',
      actorName: 'Rabbi Klein',
      metadata: { supportType: 'observation' },
      requireMetadata: true,
    })).rejects.toThrow('PGRST204')

    expect(primaryInsert).toHaveBeenCalledTimes(1)
  })

  it('preserves observation metadata when retrying without an optional missing note column', async () => {
    const firstSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST204', message: 'Could not find the created_by_name column of student_notes in the schema cache' },
    })
    const secondSingle = vi.fn().mockResolvedValue({
      data: {
        id: 11,
        student_id: 4,
        student_name: 'Ari',
        note: 'Worked independently for ten minutes.',
        author: 'Rabbi Klein',
        created_at: '2026-09-07T10:20:00Z',
        metadata: { supportType: 'observation', relatedGoalId: null },
      },
      error: null,
    })
    const single = vi.fn()
      .mockImplementationOnce(firstSingle)
      .mockImplementationOnce(secondSingle)
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    fromMock.mockReturnValue({ insert })

    await expect(createStudentNote({
      studentId: 4,
      studentName: 'Ari',
      note: 'Worked independently for ten minutes.',
      author: 'Rabbi Klein',
      actorName: 'Rabbi Klein',
      metadata: { supportType: 'observation', relatedGoalId: null },
      requireMetadata: true,
    })).resolves.toMatchObject({ metadata: { supportType: 'observation', relatedGoalId: null } })

    expect(insert).toHaveBeenNthCalledWith(1, [expect.objectContaining({
      created_by_name: 'Rabbi Klein',
      metadata: { supportType: 'observation', relatedGoalId: null },
    })])
    expect(insert).toHaveBeenNthCalledWith(2, [expect.objectContaining({
      metadata: { supportType: 'observation', relatedGoalId: null },
    })])
    expect(insert.mock.calls[1][0][0]).not.toHaveProperty('created_by_name')
  })

  it('surfaces real RLS or permission errors for observation inserts', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'new row violates row-level security policy for table "student_notes"' },
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    fromMock.mockReturnValue({ insert })

    await expect(createStudentNote({
      studentId: 4,
      studentName: 'Ari',
      note: 'Worked independently for ten minutes.',
      author: 'Rabbi Klein',
      actorName: 'Rabbi Klein',
      metadata: { supportType: 'observation', relatedGoalId: null },
      requireMetadata: true,
    })).rejects.toThrow('42501')
  })

  it('loads scoped observations in one query and retries once when is_deleted is not deployed', async () => {
    const primaryOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42703', message: 'column student_notes.is_deleted does not exist' },
    })
    const primaryEq = vi.fn().mockReturnValue({ order: primaryOrder })
    const primaryIn = vi.fn().mockReturnValue({ eq: primaryEq })
    const primarySelect = vi.fn().mockReturnValue({ in: primaryIn })

    const fallbackOrder = vi.fn().mockResolvedValue({
      data: [{
        id: 21,
        student_id: 4,
        student_name: 'Ari',
        note: 'Persisted observation',
        author: 'Rabbi Klein',
        created_at: '2026-09-07T10:20:00Z',
        metadata: { supportType: 'observation' },
      }],
      error: null,
    })
    const fallbackIn = vi.fn().mockReturnValue({ order: fallbackOrder })
    const fallbackSelect = vi.fn().mockReturnValue({ in: fallbackIn })

    fromMock
      .mockReturnValueOnce({ select: primarySelect })
      .mockReturnValueOnce({ select: fallbackSelect })

    await expect(listStudentNotesForStudents([4, 5, 4])).resolves.toEqual([
      expect.objectContaining({ id: 21, student_id: 4, metadata: { supportType: 'observation' } }),
    ])
    expect(fromMock).toHaveBeenCalledTimes(2)
    expect(primaryIn).toHaveBeenCalledWith('student_id', [4, 5])
    expect(fallbackIn).toHaveBeenCalledWith('student_id', [4, 5])
  })

  it('reports request path, auth presence, and missing HTTP status for a browser transport failure', async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'TypeError: Failed to fetch' },
    })
    const eq = vi.fn().mockReturnValue({ order })
    const inMock = vi.fn().mockReturnValue({ eq })
    const select = vi.fn().mockReturnValue({ in: inMock })
    fromMock.mockReturnValue({ select })

    await expect(listStudentNotesForStudents([7, 8])).rejects.toThrow(
      'request=https://project.supabase.co/rest/v1/student_notes?select=*&student_id=in.(7,8)&is_deleted=eq.false&order=created_at.desc; authSession=present; httpStatus=unavailable (fetch failed before a response)',
    )
  })

  it('creates and updates student goals in the support table', async () => {
    const createSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'goal-1',
        student_id: 4,
        title: 'Ask for help',
        category: 'Independence',
        target: 'Ask before frustration builds.',
        status: 'active',
        created_by: 'Rabbi Klein',
        assigned_to: 'Rabbi Klein',
        created_at: '2026-09-07T10:20:00Z',
        completed_at: null,
        metadata: { progressNotes: [] },
      },
      error: null,
    })
    const createSelect = vi.fn().mockReturnValue({ single: createSingle })
    const insert = vi.fn().mockReturnValue({ select: createSelect })

    const updateSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'goal-1',
        student_id: 4,
        title: 'Ask for help',
        category: 'Independence',
        target: 'Ask before frustration builds.',
        status: 'completed',
        created_by: 'Rabbi Klein',
        assigned_to: 'Rabbi Klein',
        created_at: '2026-09-07T10:20:00Z',
        completed_at: '2026-09-07T11:00:00Z',
        metadata: { progressNotes: [{ id: 'p1', text: 'Met target', author: 'Rabbi Klein', createdAt: '2026-09-07T11:00:00Z' }] },
      },
      error: null,
    })
    const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
    const eq = vi.fn().mockReturnValue({ select: updateSelect })
    const update = vi.fn().mockReturnValue({ eq })

    fromMock
      .mockReturnValueOnce({ insert })
      .mockReturnValueOnce({ update })

    const created = await createStudentGoal({
      studentId: 4,
      title: 'Ask for help',
      category: 'Independence',
      target: 'Ask before frustration builds.',
      createdBy: 'Rabbi Klein',
      assignedTo: 'Rabbi Klein',
    })

    const updated = await updateStudentGoal({
      ...created,
      status: 'completed',
      completedAt: '2026-09-07T11:00:00Z',
      progressNotes: [{ id: 'p1', text: 'Met target', author: 'Rabbi Klein', createdAt: '2026-09-07T11:00:00Z' }],
    })

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        student_id: 4,
        title: 'Ask for help',
        metadata: { progressNotes: [] },
      }),
    ])
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'completed',
      metadata: { progressNotes: [{ id: 'p1', text: 'Met target', author: 'Rabbi Klein', createdAt: '2026-09-07T11:00:00Z' }] },
    }))
    expect(updated.status).toBe('completed')
  })

  it('surfaces a missing goals table instead of reporting zero goals', async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'relation "public.student_goals" does not exist' },
    })
    const select = vi.fn().mockReturnValue({ order })
    fromMock.mockReturnValue({ select })

    await expect(listStudentGoals()).rejects.toMatchObject({
      message: 'relation "public.student_goals" does not exist',
    })
  })
})
