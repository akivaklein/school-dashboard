import { supabase } from '../supabaseClient'
import { isLeadershipRole } from '../utils/permissions'

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
  metadata: Record<string, unknown>
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
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {},
  }
}

function isMissingNotesColumnError(error: { message?: string } | null | undefined) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('student_notes') && (
    message.includes('column') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  )
}

function getMissingColumnName(error: { message?: string; code?: string } | null | undefined): string | null {
  const message = String(error?.message || '')
  const patterns = [
    /['"]([a-zA-Z0-9_]+)['"]\s+column/i,
    /find\s+the\s+([a-zA-Z0-9_]+)\s+column/i,
    /column\s+"([a-zA-Z0-9_]+)"/i,
  ]
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

function describeSupabaseError(error: { code?: string; message?: string; details?: string; hint?: string } | null | undefined) {
  const parts = [
    error?.code ? `code ${error.code}` : '',
    error?.message || 'Unknown Supabase error',
    error?.details ? `Details: ${error.details}` : '',
    error?.hint ? `Hint: ${error.hint}` : '',
  ].filter(Boolean)

  return parts.join(' - ')
}

export async function listStudentNotes(studentId: number): Promise<StudentNoteRecord[]> {
  const primary = await supabase
    .from('student_notes')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (!primary.error) {
    return (primary.data || []).map((row: Record<string, unknown>) => toRecord(row))
  }

  if (!isMissingNotesColumnError(primary.error)) {
    throw new Error(primary.error.message || 'Unable to load notes right now.')
  }

  const fallback = await supabase
    .from('student_notes')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (fallback.error) {
    throw new Error(fallback.error.message || 'Unable to load notes right now.')
  }

  return (fallback.data || [])
    .filter((row: Record<string, unknown>) => row.is_deleted !== true)
    .map((row: Record<string, unknown>) => toRecord(row))
}

export async function listStudentNotesForStudents(studentIds: number[]): Promise<StudentNoteRecord[]> {
  const normalizedIds = Array.from(new Set(studentIds.map(Number).filter(Number.isFinite)))
  if (normalizedIds.length === 0) return []

  const primary = await supabase
    .from('student_notes')
    .select('*')
    .in('student_id', normalizedIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (!primary.error) {
    return (primary.data || []).map((row: Record<string, unknown>) => toRecord(row))
  }

  if (!isMissingNotesColumnError(primary.error)) {
    throw primary.error
  }

  const fallback = await supabase
    .from('student_notes')
    .select('*')
    .in('student_id', normalizedIds)
    .order('created_at', { ascending: false })

  if (fallback.error) throw fallback.error

  return (fallback.data || [])
    .filter((row: Record<string, unknown>) => row.is_deleted !== true)
    .map((row: Record<string, unknown>) => toRecord(row))
}

export async function listRecentStudentNotes(studentIds: number[] = []): Promise<StudentNoteRecord[]> {
  let query = supabase
    .from('student_notes')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (studentIds.length > 0) {
    query = query.in('student_id', studentIds)
  }

  const primary = await query

  if (!primary.error) {
    return (primary.data || []).map((row: Record<string, unknown>) => toRecord(row))
  }

  if (!isMissingNotesColumnError(primary.error)) {
    throw new Error(primary.error.message || 'Unable to load recent notes right now.')
  }

  let fallbackQuery = supabase
    .from('student_notes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (studentIds.length > 0) {
    fallbackQuery = fallbackQuery.in('student_id', studentIds)
  }

  const fallback = await fallbackQuery

  if (fallback.error) {
    throw new Error(fallback.error.message || 'Unable to load recent notes right now.')
  }

  return (fallback.data || [])
    .filter((row: Record<string, unknown>) => row.is_deleted !== true)
    .map((row: Record<string, unknown>) => toRecord(row))
}

export async function createStudentNote(input: {
  studentId: number
  studentName: string
  note: string
  author: string
  actorName: string
  metadata?: Record<string, unknown>
  requireMetadata?: boolean
}) {
  let payload: Record<string, unknown> = {
    student_id: input.studentId,
    student_name: input.studentName,
    note: input.note,
    author: input.author,
    created_by_name: input.actorName,
    metadata: input.metadata || {},
  }

  while (true) {
    const attempt = await supabase
      .from('student_notes')
      .insert([payload])
      .select('*')
      .single()

    if (!attempt.error) {
      return toRecord(attempt.data as Record<string, unknown>)
    }

    const missingColumn = getMissingColumnName(attempt.error)

    if (isMissingNotesColumnError(attempt.error) && missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      if (missingColumn === 'metadata' && input.requireMetadata) {
        console.error('Structured observation insert rejected metadata column:', {
          error: attempt.error,
          payloadKeys: Object.keys(payload),
          metadata: payload.metadata,
        })
        throw new Error(`Unable to save structured observation metadata. Supabase returned ${describeSupabaseError(attempt.error)}`)
      }

      payload = { ...payload }
      delete payload[missingColumn]
      continue
    }

    console.error('Student note insert failed:', {
      error: attempt.error,
      payloadKeys: Object.keys(payload),
      metadata: payload.metadata,
    })
    throw new Error(`Unable to save student note. Supabase returned ${describeSupabaseError(attempt.error)}`)
  }
}

export async function updateStudentNote(input: {
  noteId: number
  note: string
  actorName: string
}) {
  const primary = await supabase
    .from('student_notes')
    .update({
      note: input.note,
      updated_by_name: input.actorName,
    })
    .eq('id', input.noteId)
    .eq('is_deleted', false)
    .select('*')
    .single()

  if (!primary.error) {
    return toRecord(primary.data as Record<string, unknown>)
  }

  if (!isMissingNotesColumnError(primary.error)) {
    throw new Error(primary.error.message || 'Unable to update note right now.')
  }

  const fallback = await supabase
    .from('student_notes')
    .update({ note: input.note })
    .eq('id', input.noteId)
    .select('*')
    .single()

  if (fallback.error) {
    throw new Error(fallback.error.message || 'Unable to update note right now.')
  }

  return toRecord(fallback.data as Record<string, unknown>)
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
  if (isLeadershipRole(params.role)) return true
  if (!params.actorUserId || !params.noteCreatedByUserId) return false
  return params.actorUserId === params.noteCreatedByUserId
}
