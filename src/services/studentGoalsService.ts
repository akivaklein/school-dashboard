import { supabase } from '../supabaseClient'

export type StudentGoal = {
  id: string
  studentId: number
  title: string
  category: string
  target: string
  status: 'active' | 'completed'
  progressNotes: Array<{
    id: string
    text: string
    author: string
    createdAt: string
  }>
  createdBy: string
  assignedTo: string
  createdAt: string
  completedAt: string | null
}

function toGoal(row: Record<string, unknown>): StudentGoal {
  const metadata = row.metadata && typeof row.metadata === 'object'
    ? row.metadata as Record<string, unknown>
    : {}

  return {
    id: String(row.id),
    studentId: Number(row.student_id),
    title: String(row.title || ''),
    category: String(row.category || 'General'),
    target: String(row.target || ''),
    status: row.status === 'completed' ? 'completed' : 'active',
    progressNotes: Array.isArray(metadata.progressNotes) ? metadata.progressNotes as StudentGoal['progressNotes'] : [],
    createdBy: String(row.created_by || ''),
    assignedTo: String(row.assigned_to || ''),
    createdAt: String(row.created_at || ''),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  }
}

export async function listStudentGoals(): Promise<StudentGoal[]> {
  const { data, error } = await supabase
    .from('student_goals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []).map((row: Record<string, unknown>) => toGoal(row))
}

export async function createStudentGoal(input: {
  studentId: number
  title: string
  category: string
  target: string
  createdBy: string
  assignedTo: string
}): Promise<StudentGoal> {
  const normalizedTitle = String(input.title || '').trim()
  const normalizedTarget = String(input.target || '').trim()

  if (!normalizedTitle) throw new Error('Goal title is required.')
  if (!normalizedTarget) throw new Error('Goal target is required.')

  const { data, error } = await supabase
    .from('student_goals')
    .insert([{
      student_id: input.studentId,
      title: normalizedTitle,
      category: String(input.category || 'General').trim() || 'General',
      target: normalizedTarget,
      status: 'active',
      created_by: input.createdBy,
      assigned_to: input.assignedTo || input.createdBy,
      metadata: { progressNotes: [] },
    }])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message || 'Unable to create student goal.')
  }

  return toGoal(data as Record<string, unknown>)
}

export async function updateStudentGoal(goal: StudentGoal): Promise<StudentGoal> {
  const { data, error } = await supabase
    .from('student_goals')
    .update({
      title: goal.title,
      category: goal.category,
      target: goal.target,
      status: goal.status,
      assigned_to: goal.assignedTo,
      completed_at: goal.status === 'completed' ? goal.completedAt || new Date().toISOString() : null,
      metadata: { progressNotes: goal.progressNotes || [] },
    })
    .eq('id', goal.id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message || 'Unable to update student goal.')
  }

  return toGoal(data as Record<string, unknown>)
}
