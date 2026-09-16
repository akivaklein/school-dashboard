import { describe, expect, it } from 'vitest'
import { getStudentTaskDueAt, getStudentTaskStatus, type StudentTask } from '../studentTasksService'

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
}

describe('student task status', () => {
  it('keeps one-time tasks overdue until explicitly completed', () => {
    const now = new Date('2026-09-16T10:00:00.000Z')
    expect(getStudentTaskStatus(baseTask, now)).toBe('Overdue')
    expect(getStudentTaskStatus({ ...baseTask, completed_at: now.toISOString() }, now)).toBe('Done')
  })

  it('uses the current day due time for daily-until-done tasks', () => {
    const task = { ...baseTask, repeat_type: 'daily_until_done' as const }
    const now = new Date('2026-09-18T08:00:00.000Z')
    expect(getStudentTaskDueAt(task, now).toISOString()).toBe('2026-09-18T09:00:00.000Z')
    expect(getStudentTaskStatus(task, now)).toBe('Due')
  })
})
