import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { canAdvanceSeries, completeStudentTask, getNextOccurrenceDueAt, getSnoozedUntil, getStudentTaskDueAt, getStudentTaskStatus, skipStudentTask, type StudentTask } from '../studentTasksService'

const baseTask: StudentTask = {
  id: 'task-1',
  student_id: 1,
  title: 'Bring signed form',
  note: '',
  due_at: '2026-09-16T09:00:00.000Z',
  repeat_type: 'one_time',
  reminder_start_at: '2026-09-16T08:45:00.000Z',
  snoozed_until: null,
  notification_preference: 'email_text',
  recurrence_days: [],
  series_id: null,
  occurrence_number: 1,
  notification_cycle: 'cycle-1',
  created_by: 'Staff',
  created_at: '2026-09-15T12:00:00.000Z',
  updated_at: '2026-09-15T12:00:00.000Z',
  completed_at: null,
  completed_by: null,
  skipped_at: null,
  skipped_by: null,
  recurrence_canceled_at: null,
  recurrence_canceled_by: null,
}

describe('student task status', () => {
  it('keeps one-time tasks overdue until explicitly completed', () => {
    const now = new Date('2026-09-16T10:00:00.000Z')
    expect(getStudentTaskStatus(baseTask, now)).toBe('Overdue')
    expect(getStudentTaskStatus({ ...baseTask, completed_at: now.toISOString() }, now)).toBe('Done')
  })

  it('creates the next daily occurrence instead of moving the completed row', () => {
    const task = { ...baseTask, repeat_type: 'daily_until_done' as const }
    expect(getStudentTaskDueAt(task).toISOString()).toBe('2026-09-16T09:00:00.000Z')
    expect(getNextOccurrenceDueAt(task)?.toISOString()).toBe('2026-09-17T09:00:00.000Z')
  })

  it('supports reminder start, snooze, and weekday recurrence status', () => {
    const task = { ...baseTask, reminder_start_at: '2026-09-16T08:00:00.000Z', repeat_type: 'weekdays' as const }
    expect(getStudentTaskStatus(task, new Date('2026-09-16T07:00:00.000Z'))).toBe('Upcoming')
    expect(getStudentTaskStatus({ ...task, snoozed_until: '2026-09-16T10:30:00.000Z' }, new Date('2026-09-16T10:00:00.000Z'))).toBe('Snoozed')
    expect(getNextOccurrenceDueAt(task)?.toISOString()).toBe('2026-09-17T09:00:00.000Z')
  })

  it('calculates quick and custom snooze times from the current time', () => {
    const now = new Date('2026-09-16T10:00:00.000Z')
    expect(getSnoozedUntil(5, now).toISOString()).toBe('2026-09-16T10:05:00.000Z')
    expect(getSnoozedUntil(10, now).toISOString()).toBe('2026-09-16T10:10:00.000Z')
    expect(getSnoozedUntil(23, now).toISOString()).toBe('2026-09-16T10:23:00.000Z')
    expect(() => getSnoozedUntil(0, now)).toThrow('Snooze minutes must be greater than zero.')
  })

  it('treats a skipped occurrence as closed history distinct from Done', () => {
    const task = { ...baseTask, repeat_type: 'every_day' as const, skipped_at: '2026-09-16T09:05:00.000Z', skipped_by: 'Staff' }
    expect(getStudentTaskStatus(task)).toBe('Skipped')
  })

  it('stops advancing a series once its recurrence is canceled, but keeps it recurring until then', () => {
    const task = { ...baseTask, repeat_type: 'weekdays' as const }
    expect(canAdvanceSeries(task)).toBe(true)
    expect(canAdvanceSeries({ ...task, recurrence_canceled_at: '2026-09-16T09:05:00.000Z', recurrence_canceled_by: 'Staff' })).toBe(false)
    expect(canAdvanceSeries({ ...baseTask, repeat_type: 'one_time' })).toBe(false)
  })
})

describe('student task completion', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('marks a one-time occurrence Done without creating another task', async () => {
    const completed = { ...baseTask, completed_at: '2026-09-16T10:00:00.000Z', completed_by: 'Rabbi Cohen' }
    const single = vi.fn().mockResolvedValue({ data: completed, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const insert = vi.fn()
    fromMock.mockReturnValue({ update, insert })

    const result = await completeStudentTask(baseTask, 'Rabbi Cohen')

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ completed_at: expect.any(String), completed_by: 'Rabbi Cohen', snoozed_until: null }))
    expect(result).toEqual({ completed, next: null })
    expect(insert).not.toHaveBeenCalled()
  })

  function mockRecurringTables({ completed, existing, upserted }: { completed: StudentTask; existing: StudentTask | null; upserted: StudentTask[] }) {
    const updateSingle = vi.fn().mockResolvedValue({ data: completed, error: null })
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: updateSingle }) }) })
    const maybeSingle = vi.fn().mockResolvedValue({ data: existing, error: null })
    const lookupEqOccurrence = vi.fn().mockReturnValue({ maybeSingle })
    const lookupEqSeries = vi.fn().mockReturnValue({ eq: lookupEqOccurrence })
    const select = vi.fn().mockReturnValue({ eq: lookupEqSeries })
    const upsertSelect = vi.fn().mockResolvedValue({ data: upserted, error: null })
    const upsert = vi.fn().mockReturnValue({ select: upsertSelect })
    const insert = vi.fn()
    fromMock.mockReturnValue({ update, select, upsert, insert })
    return { update, upsert, insert, lookupEqSeries, lookupEqOccurrence }
  }

  it('marks only the recurring occurrence Done and creates its next occurrence', async () => {
    const recurring = { ...baseTask, repeat_type: 'every_day' as const, series_id: 'series-1' }
    const completed = { ...recurring, completed_at: '2026-09-16T10:00:00.000Z', completed_by: 'Rabbi Cohen' }
    const next = { ...recurring, id: 'task-2', due_at: '2026-09-17T09:00:00.000Z', reminder_start_at: '2026-09-17T08:45:00.000Z', occurrence_number: 2, notification_cycle: 'cycle-2' }
    const { update, upsert, insert } = mockRecurringTables({ completed, existing: null, upserted: [next] })

    const result = await completeStudentTask(recurring, 'Rabbi Cohen')

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ completed_by: 'Rabbi Cohen', snoozed_until: null }))
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ series_id: 'series-1', occurrence_number: 2, due_at: '2026-09-17T09:00:00.000Z', reminder_start_at: '2026-09-17T08:45:00.000Z' }),
      { onConflict: 'series_id,occurrence_number', ignoreDuplicates: true },
    )
    expect(insert).not.toHaveBeenCalled()
    expect(result).toEqual({ completed, next })
  })

  // Regression: the hourly advance job had already created occurrences 2..4, so Done/Skip on
  // occurrence 1 inserted a duplicate (series-1, 2) and Supabase returned 409
  // "student_tasks_series_occurrence_unique". The existing occurrence must be reused instead.
  it.each([
    ['Done', (task: StudentTask) => completeStudentTask(task, 'Rabbi Cohen').then(result => result.next)],
    ['Skip', (task: StudentTask) => skipStudentTask(task, 'Rabbi Cohen').then(result => result.next)],
  ])('%s reuses an already-created next occurrence instead of inserting a duplicate (409)', async (_label, close) => {
    const recurring = { ...baseTask, repeat_type: 'every_day' as const, series_id: 'series-1' }
    const closed = { ...recurring, completed_at: '2026-09-16T10:00:00.000Z', completed_by: 'Rabbi Cohen' }
    const existingNext = { ...recurring, id: 'task-2-precreated', due_at: '2026-09-17T09:00:00.000Z', occurrence_number: 2, notification_cycle: 'cycle-2' }
    const { upsert, insert, lookupEqSeries, lookupEqOccurrence } = mockRecurringTables({ completed: closed, existing: existingNext, upserted: [] })

    const next = await close(recurring)

    expect(lookupEqSeries).toHaveBeenCalledWith('series_id', 'series-1')
    expect(lookupEqOccurrence).toHaveBeenCalledWith('occurrence_number', 2)
    expect(next).toEqual(existingNext)
    expect(upsert).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })

  it('returns the concurrently-created occurrence when the insert loses a race', async () => {
    const recurring = { ...baseTask, repeat_type: 'every_day' as const, series_id: 'series-1' }
    const completed = { ...recurring, completed_at: '2026-09-16T10:00:00.000Z', completed_by: 'Rabbi Cohen' }
    const racedNext = { ...recurring, id: 'task-2-raced', due_at: '2026-09-17T09:00:00.000Z', occurrence_number: 2 }
    const maybeSingle = vi.fn().mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: racedNext, error: null })
    const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) })
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: completed, error: null }) }) }) })
    const upsert = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) })
    fromMock.mockReturnValue({ update, select, upsert })

    const result = await completeStudentTask(recurring, 'Rabbi Cohen')

    expect(upsert).toHaveBeenCalledTimes(1)
    expect(result.next).toEqual(racedNext)
  })
})
