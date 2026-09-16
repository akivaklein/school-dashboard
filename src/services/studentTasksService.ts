import { supabase } from '../supabaseClient'

export type StudentTaskRepeat = 'one_time' | 'daily_until_done' | 'every_day' | 'weekdays' | 'specific_days'
export type StudentTaskNotification = 'dashboard_only' | 'email' | 'text' | 'email_text'

export type StudentTask = {
  id: string
  student_id: number
  title: string
  note: string
  due_at: string
  repeat_type: StudentTaskRepeat
  reminder_start_at: string | null
  snoozed_until: string | null
  notification_preference: StudentTaskNotification
  recurrence_days: number[]
  series_id: string | null
  occurrence_number: number
  created_by: string
  created_at: string
  updated_at: string
  completed_at: string | null
  completed_by: string | null
}

function mapTask(row: Record<string, unknown>): StudentTask {
  return {
    id: String(row.id),
    student_id: Number(row.student_id),
    title: String(row.title || ''),
    note: String(row.note || ''),
    due_at: String(row.due_at),
    repeat_type: ['daily_until_done', 'every_day', 'weekdays', 'specific_days'].includes(String(row.repeat_type)) ? row.repeat_type as StudentTaskRepeat : 'one_time',
    reminder_start_at: row.reminder_start_at ? String(row.reminder_start_at) : null,
    snoozed_until: row.snoozed_until ? String(row.snoozed_until) : null,
    notification_preference: ['email', 'text', 'email_text'].includes(String(row.notification_preference)) ? row.notification_preference as StudentTaskNotification : 'dashboard_only',
    recurrence_days: Array.isArray(row.recurrence_days) ? row.recurrence_days.map(Number) : [],
    series_id: row.series_id ? String(row.series_id) : null,
    occurrence_number: Number(row.occurrence_number || 1),
    created_by: String(row.created_by || 'Staff'),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
    completed_at: row.completed_at ? String(row.completed_at) : null,
    completed_by: row.completed_by ? String(row.completed_by) : null,
  }
}

export function getStudentTaskDueAt(task: StudentTask) {
  const initialDue = new Date(task.due_at)
  return initialDue
}

export type StudentTaskStatus = 'Upcoming' | 'Snoozed' | 'Due' | 'Overdue' | 'Done'

export function getStudentTaskStatus(task: StudentTask, now = new Date()): StudentTaskStatus {
  if (task.completed_at) return 'Done'
  if (task.snoozed_until && new Date(task.snoozed_until).getTime() > now.getTime()) return 'Snoozed'
  if (task.reminder_start_at && new Date(task.reminder_start_at).getTime() > now.getTime()) return 'Upcoming'
  return getStudentTaskDueAt(task).getTime() < now.getTime() ? 'Overdue' : 'Due'
}

export function isRecurringTask(task: StudentTask) {
  return task.repeat_type !== 'one_time'
}

export function getNextOccurrenceDueAt(task: StudentTask): Date | null {
  if (!isRecurringTask(task)) return null
  const due = new Date(task.due_at)
  for (let offset = 1; offset <= 14; offset += 1) {
    const next = new Date(due)
    next.setDate(due.getDate() + offset)
    const day = next.getDay()
    if (task.repeat_type === 'every_day' || task.repeat_type === 'daily_until_done' || (task.repeat_type === 'weekdays' && day >= 1 && day <= 5) || (task.repeat_type === 'specific_days' && task.recurrence_days.includes(day))) return next
  }
  return null
}

export async function listStudentTasks(): Promise<StudentTask[]> {
  const { data, error } = await supabase
    .from('student_tasks')
    .select('*')
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('due_at', { ascending: true })

  if (error) throw new Error(error.message || 'Unable to load student tasks')
  return (data || []).map(mapTask)
}

export async function createStudentTask(input: {
  studentId: number
  title: string
  note?: string
  dueAt: string
  repeatType?: StudentTaskRepeat
  reminderStartAt?: string | null
  recurrenceDays?: number[]
  notificationPreference?: StudentTaskNotification
  seriesId?: string | null
  occurrenceNumber?: number
  createdBy: string
}): Promise<StudentTask> {
  const title = String(input.title || '').trim()
  if (!title) throw new Error('Task title is required.')
  const payload = {
    student_id: input.studentId,
    title,
    note: String(input.note || '').trim() || null,
    due_at: input.dueAt,
    repeat_type: input.repeatType || 'one_time',
    reminder_start_at: input.reminderStartAt || null,
    recurrence_days: input.recurrenceDays || [],
    notification_preference: input.notificationPreference || 'dashboard_only',
    series_id: input.seriesId || null,
    occurrence_number: input.occurrenceNumber || 1,
    created_by: String(input.createdBy || 'Staff').trim() || 'Staff',
  }
  const { data, error } = await supabase.from('student_tasks').insert(payload).select('*').single()
  if (error) throw new Error(error.message || 'Unable to create student task')
  const created = mapTask(data)
  if (isRecurringTask(created) && !created.series_id) {
    const { data: linked, error: linkError } = await supabase.from('student_tasks').update({ series_id: created.id }).eq('id', created.id).select('*').single()
    if (!linkError && linked) return mapTask(linked)
  }
  return created
}

export async function updateStudentTask(id: string, updates: Partial<Pick<StudentTask, 'title' | 'note' | 'due_at' | 'repeat_type' | 'completed_at' | 'completed_by' | 'reminder_start_at' | 'recurrence_days' | 'notification_preference' | 'snoozed_until' | 'series_id' | 'occurrence_number'>>): Promise<StudentTask> {
  const payload = {
    ...(updates.title !== undefined ? { title: String(updates.title).trim() } : {}),
    ...(updates.note !== undefined ? { note: String(updates.note || '').trim() || null } : {}),
    ...(updates.due_at !== undefined ? { due_at: updates.due_at } : {}),
    ...(updates.repeat_type !== undefined ? { repeat_type: updates.repeat_type } : {}),
    ...(updates.reminder_start_at !== undefined ? { reminder_start_at: updates.reminder_start_at } : {}),
    ...(updates.recurrence_days !== undefined ? { recurrence_days: updates.recurrence_days } : {}),
    ...(updates.notification_preference !== undefined ? { notification_preference: updates.notification_preference } : {}),
    ...(updates.snoozed_until !== undefined ? { snoozed_until: updates.snoozed_until } : {}),
    ...(updates.series_id !== undefined ? { series_id: updates.series_id } : {}),
    ...(updates.occurrence_number !== undefined ? { occurrence_number: updates.occurrence_number } : {}),
    ...(updates.completed_at !== undefined ? { completed_at: updates.completed_at } : {}),
    ...(updates.completed_by !== undefined ? { completed_by: updates.completed_by } : {}),
  }
  const { data, error } = await supabase.from('student_tasks').update(payload).eq('id', id).select('*').single()
  if (error) throw new Error(error.message || 'Unable to update student task')
  return mapTask(data)
}

export async function snoozeStudentTask(task: StudentTask, snoozedUntil: string, snoozedBy: string): Promise<StudentTask> {
  const { error: historyError } = await supabase.from('student_task_snoozes').insert({ task_id: task.id, snoozed_until: snoozedUntil, snoozed_by: snoozedBy || 'Staff' })
  if (historyError) throw new Error(historyError.message || 'Unable to save snooze history')
  return updateStudentTask(task.id, { snoozed_until: snoozedUntil })
}

export async function completeStudentTask(task: StudentTask, completedBy: string): Promise<{ completed: StudentTask; next: StudentTask | null }> {
  const completed = await updateStudentTask(task.id, { completed_at: new Date().toISOString(), completed_by: completedBy || 'Staff', snoozed_until: null })
  const nextDue = getNextOccurrenceDueAt(task)
  if (!nextDue) return { completed, next: null }
  const next = await createStudentTask({
    studentId: task.student_id,
    title: task.title,
    note: task.note,
    dueAt: nextDue.toISOString(),
    reminderStartAt: task.reminder_start_at ? new Date(new Date(task.reminder_start_at).getTime() + (nextDue.getTime() - new Date(task.due_at).getTime())).toISOString() : null,
    repeatType: task.repeat_type,
    recurrenceDays: task.recurrence_days,
    notificationPreference: task.notification_preference,
    seriesId: task.series_id,
    occurrenceNumber: task.occurrence_number + 1,
    createdBy: task.created_by,
  })
  return { completed, next }
}

export async function deleteStudentTask(id: string): Promise<void> {
  const { error } = await supabase.from('student_tasks').delete().eq('id', id)
  if (error) throw new Error(error.message || 'Unable to delete student task')
}
