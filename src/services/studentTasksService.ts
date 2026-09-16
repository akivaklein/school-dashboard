import { supabase } from '../supabaseClient'

export type StudentTaskRepeat = 'one_time' | 'daily_until_done'

export type StudentTask = {
  id: string
  student_id: number
  title: string
  note: string
  due_at: string
  repeat_type: StudentTaskRepeat
  created_by: string
  created_at: string
  updated_at: string
  completed_at: string | null
  completed_by: string | null
}

export type StudentTaskStatus = 'Due' | 'Overdue' | 'Done'

function mapTask(row: Record<string, unknown>): StudentTask {
  return {
    id: String(row.id),
    student_id: Number(row.student_id),
    title: String(row.title || ''),
    note: String(row.note || ''),
    due_at: String(row.due_at),
    repeat_type: row.repeat_type === 'daily_until_done' ? 'daily_until_done' : 'one_time',
    created_by: String(row.created_by || 'Staff'),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
    completed_at: row.completed_at ? String(row.completed_at) : null,
    completed_by: row.completed_by ? String(row.completed_by) : null,
  }
}

export function getStudentTaskDueAt(task: StudentTask, now = new Date()) {
  const initialDue = new Date(task.due_at)
  if (task.repeat_type !== 'daily_until_done' || now < initialDue) return initialDue

  const dailyDue = new Date(now)
  dailyDue.setHours(initialDue.getHours(), initialDue.getMinutes(), initialDue.getSeconds(), 0)
  return dailyDue
}

export function getStudentTaskStatus(task: StudentTask, now = new Date()): StudentTaskStatus {
  if (task.completed_at) return 'Done'
  return getStudentTaskDueAt(task, now).getTime() < now.getTime() ? 'Overdue' : 'Due'
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
    created_by: String(input.createdBy || 'Staff').trim() || 'Staff',
  }
  const { data, error } = await supabase.from('student_tasks').insert(payload).select('*').single()
  if (error) throw new Error(error.message || 'Unable to create student task')
  return mapTask(data)
}

export async function updateStudentTask(id: string, updates: Partial<Pick<StudentTask, 'title' | 'note' | 'due_at' | 'repeat_type' | 'completed_at' | 'completed_by'>>): Promise<StudentTask> {
  const payload = {
    ...(updates.title !== undefined ? { title: String(updates.title).trim() } : {}),
    ...(updates.note !== undefined ? { note: String(updates.note || '').trim() || null } : {}),
    ...(updates.due_at !== undefined ? { due_at: updates.due_at } : {}),
    ...(updates.repeat_type !== undefined ? { repeat_type: updates.repeat_type } : {}),
    ...(updates.completed_at !== undefined ? { completed_at: updates.completed_at } : {}),
    ...(updates.completed_by !== undefined ? { completed_by: updates.completed_by } : {}),
  }
  const { data, error } = await supabase.from('student_tasks').update(payload).eq('id', id).select('*').single()
  if (error) throw new Error(error.message || 'Unable to update student task')
  return mapTask(data)
}

export async function deleteStudentTask(id: string): Promise<void> {
  const { error } = await supabase.from('student_tasks').delete().eq('id', id)
  if (error) throw new Error(error.message || 'Unable to delete student task')
}
