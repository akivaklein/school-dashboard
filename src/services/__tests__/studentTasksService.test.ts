import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { canAdvanceSeries, completeStudentTask, getNextOccurrenceDueAt, getSnoozedUntil, getStudentTaskDueAt, getStudentTaskStatus, type StudentTask } from '../studentTasksService'

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

  it('marks only the recurring occurrence Done and creates its next occurrence', async () => {
    const recurring = { ...baseTask, repeat_type: 'every_day' as const, series_id: 'series-1' }
    const completed = { ...recurring, completed_at: '2026-09-16T10:00:00.000Z', completed_by: 'Rabbi Cohen' }
    const next = { ...recurring, id: 'task-2', due_at: '2026-09-17T09:00:00.000Z', reminder_start_at: '2026-09-17T08:45:00.000Z', occurrence_number: 2, notification_cycle: 'cycle-2' }
    const updateSingle = vi.fn().mockResolvedValue({ data: completed, error: null })
    const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
    const eq = vi.fn().mockReturnValue({ select: updateSelect })
    const update = vi.fn().mockReturnValue({ eq })
    const insertSingle = vi.fn().mockResolvedValue({ data: next, error: null })
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
    const insert = vi.fn().mockReturnValue({ select: insertSelect })
    fromMock.mockReturnValue({ update, insert })

    const result = await completeStudentTask(recurring, 'Rabbi Cohen')

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ completed_by: 'Rabbi Cohen', snoozed_until: null }))
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ series_id: 'series-1', occurrence_number: 2, due_at: '2026-09-17T09:00:00.000Z' }))
    expect(result).toEqual({ completed, next })
  })
})
