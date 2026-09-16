import { describe, expect, it } from 'vitest'
import {
  buildEmailHtml,
  buildEmailSubject,
  getNotificationTime,
  hasAlreadySent,
  isReadyToSend,
  providerFailureMessage,
  type ReminderTask,
} from '../../../supabase/functions/send-student-task-reminders/logic'

function task(overrides: Partial<ReminderTask> = {}): ReminderTask {
  return {
    id: 'task-1',
    student_id: 1,
    title: 'Give medication',
    note: 'With water',
    due_at: '2026-09-16T13:00:00.000Z',
    reminder_start_at: '2026-09-16T12:45:00.000Z',
    snoozed_until: null,
    notification_preference: 'email',
    notification_cycle: 'cycle-1',
    ...overrides,
  }
}

describe('student task email reminder logic', () => {
  it('sends one-time reminders when the start time is reached', () => {
    expect(isReadyToSend(task(), new Date('2026-09-16T12:44:00.000Z'))).toBe(false)
    expect(isReadyToSend(task(), new Date('2026-09-16T12:45:00.000Z'))).toBe(true)
    expect(buildEmailHtml(task(), 'Yair Bloom', 'https://yeshiva-ketana-secure.vercel.app')).toContain('Yair Bloom')
    expect(buildEmailSubject(task(), 'Yair Bloom', new Date('2026-09-16T14:00:00.000Z'))).toBe('Overdue: Give medication for Yair Bloom')
  })

  it('does not send completed tasks before their reminder time', () => {
    expect(isReadyToSend(task({ completed_at: '2026-09-16T12:30:00.000Z' }), new Date('2026-09-16T13:00:00.000Z'))).toBe(false)
  })

  it('delays a snoozed reminder until the snooze expires', () => {
    const snoozed = task({ snoozed_until: '2026-09-16T14:00:00.000Z' })
    expect(getNotificationTime(snoozed).toISOString()).toBe('2026-09-16T14:00:00.000Z')
    expect(isReadyToSend(snoozed, new Date('2026-09-16T13:59:00.000Z'))).toBe(false)
    expect(isReadyToSend(snoozed, new Date('2026-09-16T14:00:00.000Z'))).toBe(true)
  })

  it('treats recurring occurrences independently through their notification cycle', () => {
    const nextOccurrence = task({ id: 'task-2', notification_cycle: 'cycle-2', due_at: '2026-09-17T13:00:00.000Z', reminder_start_at: '2026-09-17T12:45:00.000Z' })
    const deliveries = [{ task_id: 'task-1', notification_cycle: 'cycle-1', status: 'sent' as const }]
    expect(hasAlreadySent(deliveries, task())).toBe(true)
    expect(hasAlreadySent(deliveries, nextOccurrence)).toBe(false)
  })

  it('prevents duplicate sends and records provider failures deterministically', () => {
    const delivery = [{ task_id: 'task-1', notification_cycle: 'cycle-1', status: 'sent' as const }]
    expect(hasAlreadySent(delivery, task())).toBe(true)
    expect(providerFailureMessage(429, { message: 'Rate limited' })).toBe('Rate limited')
    expect(providerFailureMessage(500)).toBe('Email provider returned HTTP 500')
  })
})
