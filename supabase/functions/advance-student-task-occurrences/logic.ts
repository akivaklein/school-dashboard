export type SeriesTip = {
  id: string
  student_id: number
  title: string
  note: string | null
  due_at: string
  reminder_start_at: string | null
  repeat_type: string
  recurrence_days: number[]
  notification_preference: string
  series_id: string
  occurrence_number: number
  recurrence_canceled_at: string | null
  created_by: string
}

export function isCalendarSeriesRepeat(repeatType: string) {
  return repeatType === 'every_day' || repeatType === 'weekdays' || repeatType === 'specific_days'
}

function matchesRepeatDay(repeatType: string, recurrenceDays: number[], day: number) {
  if (repeatType === 'every_day') return true
  if (repeatType === 'weekdays') return day >= 1 && day <= 5
  if (repeatType === 'specific_days') return recurrenceDays.includes(day)
  return false
}

// Returns every missing occurrence due date between the series tip and the
// horizon, so a series that was never opened for several days still catches up.
export function computeMissingOccurrenceDueDates(tip: SeriesTip, now: Date, horizonDays = 2, maxLookaheadDays = 60): Date[] {
  if (tip.recurrence_canceled_at) return []
  if (!isCalendarSeriesRepeat(tip.repeat_type)) return []
  const due = new Date(tip.due_at)
  const horizon = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000)
  const results: Date[] = []
  for (let offset = 1; offset <= maxLookaheadDays; offset += 1) {
    const next = new Date(due)
    next.setDate(due.getDate() + offset)
    if (next.getTime() > horizon.getTime()) break
    const day = next.getDay()
    if (matchesRepeatDay(tip.repeat_type, tip.recurrence_days, day)) results.push(next)
  }
  return results
}

export function buildOccurrenceInsert(tip: SeriesTip, dueAt: Date, occurrenceNumber: number) {
  const reminderOffsetMs = tip.reminder_start_at ? new Date(tip.reminder_start_at).getTime() - new Date(tip.due_at).getTime() : null
  return {
    student_id: tip.student_id,
    title: tip.title,
    note: tip.note,
    due_at: dueAt.toISOString(),
    repeat_type: tip.repeat_type,
    reminder_start_at: reminderOffsetMs !== null ? new Date(dueAt.getTime() + reminderOffsetMs).toISOString() : null,
    recurrence_days: tip.recurrence_days,
    notification_preference: tip.notification_preference,
    series_id: tip.series_id,
    occurrence_number: occurrenceNumber,
    created_by: tip.created_by,
  }
}

export function buildMissingOccurrenceInserts(tip: SeriesTip, now: Date, horizonDays = 2) {
  return computeMissingOccurrenceDueDates(tip, now, horizonDays).map((dueAt, index) => buildOccurrenceInsert(tip, dueAt, tip.occurrence_number + index + 1))
}
