import { describe, expect, it } from 'vitest'
import { canAdvanceSeries, getNextOccurrenceDueAt, getStudentTaskDueAt, getStudentTaskStatus, type StudentTask } from '../studentTasksService'

const baseTask: StudentTask = {
  id: 'task-1',
  student_id: 1,
  title: 'Bring signed form',
  note: '',
  due_at: '2026-09-16T09:00:00.000Z',
  repeat_type: 'one_time',
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
