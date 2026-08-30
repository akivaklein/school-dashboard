import { supabase } from '../supabaseClient'

export type GradeEntry = {
  id: string
  student_id: number
  teacher: string
  subject: string
  skill: string
  class_id: string
  class_name: string
  assessment_name: string
  assessment_type: string
  date: string
  score_type: string
  score: number | null
  max_score: number | null
  rating: string | null
  attempt_status: string
  grading_method: string
  notes: string
  entered_by: string
  entered_at: string
  updated_at: string
  source_context: string
}

export type StudentClassAssignment = {
  student_id: number
  class_id: string
  division_key: string
  updated_at: string
  updated_by: string
}

// ---------------------------------------------------------------------------
// Grade entries
// ---------------------------------------------------------------------------

export async function loadGradeEntries(studentIds?: number[]): Promise<GradeEntry[]> {
  let query = supabase
    .from('grade_entries')
    .select('*')
    .order('date', { ascending: false })

  if (studentIds?.length) {
    query = query.in('student_id', studentIds)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error loading grade entries:', error)
    return []
  }
  return (data || []) as GradeEntry[]
}

export async function upsertGradeEntry(entry: GradeEntry): Promise<GradeEntry | null> {
  const { data, error } = await supabase
    .from('grade_entries')
    .upsert(entry, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    console.error('Error upserting grade entry:', error)
    return null
  }
  return data as GradeEntry
}

export async function upsertGradeEntries(entries: GradeEntry[]): Promise<boolean> {
  if (!entries.length) return true
  const { error } = await supabase
    .from('grade_entries')
    .upsert(entries, { onConflict: 'id' })

  if (error) {
    console.error('Error upserting grade entries batch:', error)
    return false
  }
  return true
}

export async function deleteGradeEntry(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('grade_entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting grade entry:', error)
    return false
  }
  return true
}

// Convert from the in-app testScore shape to the grade_entries DB shape
export function testScoreToGradeEntry(
  score: Record<string, any>,
  studentId: number
): GradeEntry {
  return {
    id: score.id || `ge-${studentId}-${Date.now()}`,
    student_id: studentId,
    teacher: score.teacher || '',
    subject: score.subject || '',
    skill: score.skill || '',
    class_id: score.classId || score.class_id || '',
    class_name: score.className || score.class_name || '',
    assessment_name: score.assessmentName || score.assessment_name || '',
    assessment_type: score.assessmentType || score.assessment_type || 'Quiz',
    date: score.date || new Date().toISOString().slice(0, 10),
    score_type: score.scoreType || score.score_type || 'points',
    score: score.score ?? null,
    max_score: score.maxScore ?? score.max_score ?? null,
    rating: score.rating ?? null,
    attempt_status: score.attemptStatus || score.attempt_status || 'scored',
    grading_method: score.gradingMethod || score.grading_method || 'points',
    notes: score.notes || '',
    entered_by: score.enteredBy || score.entered_by || 'Staff',
    entered_at: score.enteredAt || score.entered_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source_context: score.sourceContext || score.source_context || 'manual',
  }
}

// Convert DB row back to in-app testScore shape
export function gradeEntryToTestScore(row: GradeEntry): Record<string, any> {
  return {
    id: row.id,
    teacher: row.teacher,
    subject: row.subject,
    skill: row.skill,
    classId: row.class_id,
    className: row.class_name,
    assessmentName: row.assessment_name,
    assessmentType: row.assessment_type,
    date: row.date,
    scoreType: row.score_type,
    score: row.score,
    maxScore: row.max_score,
    rating: row.rating,
    attemptStatus: row.attempt_status,
    gradingMethod: row.grading_method,
    notes: row.notes,
    enteredBy: row.entered_by,
    enteredAt: row.entered_at,
    sourceContext: row.source_context,
  }
}

// ---------------------------------------------------------------------------
// Student class assignments
// ---------------------------------------------------------------------------

export async function loadStudentClassAssignments(): Promise<StudentClassAssignment[]> {
  const { data, error } = await supabase
    .from('student_class_assignments')
    .select('*')

  if (error) {
    console.error('Error loading student class assignments:', error)
    return []
  }
  return (data || []) as StudentClassAssignment[]
}

export async function upsertStudentClassAssignment(
  studentId: number,
  classId: string,
  divisionKey: string,
  updatedBy: string
): Promise<boolean> {
  const { error } = await supabase
    .from('student_class_assignments')
    .upsert(
      { student_id: studentId, class_id: classId, division_key: divisionKey, updated_by: updatedBy },
      { onConflict: 'student_id' }
    )

  if (error) {
    console.error('Error upserting student class assignment:', error)
    return false
  }
  return true
}

export async function upsertStudentClassAssignmentBatch(
  assignments: Array<{ studentId: number; classId: string; divisionKey: string; updatedBy: string }>
): Promise<boolean> {
  if (!assignments.length) return true
  const rows = assignments.map(a => ({
    student_id: a.studentId,
    class_id: a.classId,
    division_key: a.divisionKey,
    updated_by: a.updatedBy,
  }))

  const { error } = await supabase
    .from('student_class_assignments')
    .upsert(rows, { onConflict: 'student_id' })

  if (error) {
    console.error('Error batch upserting student class assignments:', error)
    return false
  }
  return true
}
