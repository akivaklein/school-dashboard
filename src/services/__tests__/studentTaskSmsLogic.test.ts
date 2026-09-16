import { describe, expect, it } from 'vitest'
import { buildSmsText, isReadyToSend, isSmsEligible, type ReminderTask } from '../../../supabase/functions/send-student-task-reminders/logic'

const task: ReminderTask = {
  id: 'sms-task',
  student_id: 1,
  title: 'Give medication',
  note: null,
  due_at: '2026-09-16T13:00:00.000Z',
  reminder_start_at: '2026-09-16T12:45:00.000Z',
  snoozed_until: null,
  notification_preference: 'text',
  notification_cycle: 'cycle-sms',
}

describe('student task SMS logic', () => {
  it('only enables Text and Email + Text preferences', () => {
    expect(isSmsEligible(task)).toBe(true)
    expect(isSmsEligible({ ...task, notification_preference: 'email' })).toBe(false)
    expect(isSmsEligible({ ...task, notification_preference: 'email_text' })).toBe(true)
  })

  it('respects reminder start, snooze, completion, and builds a single-recipient message', () => {
    expect(isReadyToSend(task, new Date('2026-09-16T12:44:00.000Z'))).toBe(false)
    expect(isReadyToSend({ ...task, snoozed_until: '2026-09-16T14:00:00.000Z' }, new Date('2026-09-16T13:00:00.000Z'))).toBe(false)
    expect(isReadyToSend({ ...task, completed_at: '2026-09-16T12:30:00.000Z' }, new Date('2026-09-16T13:00:00.000Z'))).toBe(false)
    expect(buildSmsText(task, 'Bloom Yair', 'https://yeshiva-ketana-secure.vercel.app')).toContain('Bloom Yair')
  })
})
