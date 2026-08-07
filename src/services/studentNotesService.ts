import { supabase } from '../supabaseClient'

export type StudentNoteRecord = {
  id: number
  student_id: number
  student_name: string
  note: string
  author: string
  created_at: string
  created_by_user_id: string | null
  created_by_name: string | null
  updated_at: string | null
  updated_by_user_id: string | null
  updated_by_name: string | null
  is_deleted: boolean
  deleted_at: string | null
  deleted_by_user_id: string | null
  deleted_by_name: string | null
}

function toRecord(row: Record<string, unknown>): StudentNoteRecord {
  return {
    id: Number(row.id),
    student_id: Number(row.student_id),
    student_name: String(row.student_name || ''),
    note: String(row.note || ''),
    author: String(row.author || ''),
    created_at: String(row.created_at || ''),
    created_by_user_id: row.created_by_user_id ? String(row.created_by_user_id) : null,
    created_by_name: row.created_by_name ? String(row.created_by_name) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
    updated_by_user_id: row.updated_by_user_id ? String(row.updated_by_user_id) : null,
    updated_by_name: row.updated_by_name ? String(row.updated_by_name) : null,
    is_deleted: row.is_deleted === true,
    deleted_at: row.deleted_at ? String(row.deleted_at) : null,
    deleted_by_user_id: row.deleted_by_user_id ? String(row.deleted_by_user_id) : null,
    deleted_by_name: row.deleted_by_name ? String(row.deleted_by_name) : null,
  }
}

export async function listStudentNotes(studentId: number): Promise<StudentNoteRecord[]> {
  const { data, error } = await supabase
    .from('student_notes')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Unable to load notes right now.')
  }

  return (data || []).map((row: Record<string, unknown>) => toRecord(row))
}

export async function createStudentNote(input: {
  studentId: number
  studentName: string
  note: string
  author: string
  actorName: string
}) {
  const { data, error } = await supabase
    .from('student_notes')
    .insert([
      {
        student_id: input.studentId,
        student_name: input.studentName,
        note: input.note,
        author: input.author,
        created_by_name: input.actorName,
      },
    ])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message || 'Unable to save note right now.')
  }

  return toRecord(data as Record<string, unknown>)
}

export async function updateStudentNote(input: {
  noteId: number
  note: string
  actorName: string
}) {
  const { data, error } = await supabase
    .from('student_notes')
    .update({
      note: input.note,
      updated_by_name: input.actorName,
    })
    .eq('id', input.noteId)
    .eq('is_deleted', false)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message || 'Unable to update note right now.')
  }

  return toRecord(data as Record<string, unknown>)
}

export async function archiveStudentNote(input: {
  noteId: number
  actorName: string
}) {
  const { error } = await supabase
    .from('student_notes')
    .update({
      is_deleted: true,
      deleted_by_name: input.actorName,
      deleted_at: new Date().toISOString(),
      updated_by_name: input.actorName,
    })
    .eq('id', input.noteId)
    .eq('is_deleted', false)

  if (error) {
    throw new Error(error.message || 'Unable to remove note right now.')
  }
}

export function canManageStudentNote(params: {
  role: string
  actorUserId: string | null
  noteCreatedByUserId: string | null
}) {
  if (params.role === 'admin') return true
  if (!params.actorUserId || !params.noteCreatedByUserId) return false
  return params.actorUserId === params.noteCreatedByUserId
}
