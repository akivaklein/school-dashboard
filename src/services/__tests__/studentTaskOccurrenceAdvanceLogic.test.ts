import { describe, expect, it } from 'vitest'
import { buildMissingOccurrenceInserts, computeMissingOccurrenceDueDates, isCalendarSeriesRepeat, type SeriesTip } from '../../../supabase/functions/advance-student-task-occurrences/logic'

function tip(overrides: Partial<SeriesTip> = {}): SeriesTip {
  return {
    id: 'task-5',
    student_id: 1,
    title: 'Give medication',
    note: 'With water',
    due_at: '2026-09-11T13:00:00.000Z', // Friday
    reminder_start_at: '2026-09-11T12:45:00.000Z',
    repeat_type: 'weekdays',
    recurrence_days: [],
    notification_preference: 'email',
    series_id: 'series-1',
    occurrence_number: 3,
    recurrence_canceled_at: null,
    created_by: 'Staff',
    ...overrides,
  }
}

describe('student task series durability', () => {
  it('catches up every missed weekday occurrence even after several days without anyone opening the app', () => {
    // Last occurrence was Friday; nobody logged in until the following Wednesday.
    const now = new Date('2026-09-16T09:00:00.000Z')
    const dueDates = computeMissingOccurrenceDueDates(tip(), now, 2)
    expect(dueDates.map(date => date.toISOString())).toEqual([
      '2026-09-14T13:00:00.000Z', // Monday
      '2026-09-15T13:00:00.000Z', // Tuesday
      '2026-09-16T13:00:00.000Z', // Wednesday (today)
      '2026-09-17T13:00:00.000Z', // Thursday (pre-created within the lookahead horizon)
    ])
  })

  it('skips weekends for weekday series and only matches selected days for specific-day series', () => {
    const weekdayDates = computeMissingOccurrenceDueDates(tip(), new Date('2026-09-13T00:00:00.000Z'), 3)
    expect(weekdayDates.some(date => date.getDay() === 0 || date.getDay() === 6)).toBe(false)

    const specificDaysTip = tip({ repeat_type: 'specific_days', recurrence_days: [2] }) // Tuesday only
    const dates = computeMissingOccurrenceDueDates(specificDaysTip, new Date('2026-09-20T00:00:00.000Z'), 10)
    expect(dates.every(date => date.getDay() === 2)).toBe(true)
  })

  it('never advances a series once its recurrence has been explicitly canceled', () => {
    const canceled = tip({ recurrence_canceled_at: '2026-09-12T00:00:00.000Z' })
    expect(computeMissingOccurrenceDueDates(canceled, new Date('2026-09-20T00:00:00.000Z'))).toEqual([])
  })

  it('does not auto-advance "daily until done" tasks, which stay open until manually completed', () => {
    expect(isCalendarSeriesRepeat('daily_until_done')).toBe(false)
    expect(computeMissingOccurrenceDueDates(tip({ repeat_type: 'daily_until_done' }), new Date('2026-09-20T00:00:00.000Z'))).toEqual([])
  })

  it('builds insertable rows with incrementing occurrence numbers and a preserved reminder offset', () => {
    const rows = buildMissingOccurrenceInserts(tip(), new Date('2026-09-16T09:00:00.000Z'), 2)
    expect(rows).toHaveLength(4)
    expect(rows[0].occurrence_number).toBe(4)
    expect(rows[1].occurrence_number).toBe(5)
    expect(rows[0].series_id).toBe('series-1')
    expect(rows[0].reminder_start_at).toBe('2026-09-14T12:45:00.000Z')
  })
})
