import { supabase } from '../supabaseClient'

type StudentFlag = {
  id: string
  studentId?: number | string
  [key: string]: unknown
}

type StudentFlagRow = {
  id: string
  student_id: number | null
  payload: Record<string, unknown>
}

function normalizeStudentId(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function listStudentFlags(): Promise<StudentFlag[]> {
  const { data, error } = await supabase
    .from('student_flags')
    .select('id, student_id, payload')
    .order('created_at', { ascending: true })

  if (error) throw error

  return ((data || []) as StudentFlagRow[]).map(row => ({
    ...(row.payload || {}),
    id: row.id,
    studentId: row.student_id,
  }))
}

export async function replaceStudentFlags(flags: StudentFlag[]): Promise<void> {
  const normalized = flags.map(flag => ({
    id: String(flag.id),
    student_id: normalizeStudentId(flag.studentId),
    payload: flag,
    updated_at: new Date().toISOString(),
  }))

  const { data: existingRows, error: existingError } = await supabase
    .from('student_flags')
    .select('id')

  if (existingError) throw existingError

  if (normalized.length > 0) {
    const { error: upsertError } = await supabase
      .from('student_flags')
      .upsert(normalized, { onConflict: 'id' })

    if (upsertError) throw upsertError
  }

  const nextIds = new Set(normalized.map(row => row.id))
  const idsToDelete = (existingRows || [])
    .map(row => String(row.id))
    .filter(id => !nextIds.has(id))

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('student_flags')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) throw deleteError
  }
}
