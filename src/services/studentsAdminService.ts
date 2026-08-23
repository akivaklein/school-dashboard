import { supabase } from '../supabaseClient'

type StudentMutationPayload = {
  name: string
  className: string
  classId?: string
  grade?: string | number | null
  status?: string
  isActive?: boolean
  teacherAssignments?: string[]
  supportAssignments?: string[]
  family?: Record<string, string>
  assignedTherapist?: string
  therapyFrequency?: string
  therapyNotes?: string
}

type DeletionImpact = {
  attendanceHistoryRows: number
  notesRows: number
  pointsHistoryRows: number
  storeRedemptionsRows: number
  classAssignmentsRows: number
  supportRows: number
  assignmentRows: number
  relatedActivityRows: number
}

function normalizeFamilyDetails(family: Record<string, string> | undefined) {
  const src = family || {}
  return {
    fatherName: String(src.fatherName || '').trim(),
    motherName: String(src.motherName || '').trim(),
    fatherPhone: String(src.fatherPhone || '').trim(),
    motherPhone: String(src.motherPhone || '').trim(),
    address: String(src.address || '').trim(),
    emergencyContact: String(src.emergencyContact || '').trim(),
    emergencyPhone: String(src.emergencyPhone || '').trim(),
  }
}

function normalizeAssignments(values: string[] | undefined) {
  return Array.from(new Set((values || []).map(value => String(value || '').trim()).filter(Boolean)))
}

export function normalizeStudentGrade(value: string | number | null | undefined): string {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) return ''

  if (raw.includes('alef')) return '8'
  if (raw.includes('beis') || raw.includes('beit')) return '7'
  if (/(^|[^0-9])8([^0-9]|$)/.test(raw)) return '8'
  if (/(^|[^0-9])7([^0-9]|$)/.test(raw)) return '7'

  return ''
}

const GRADE_CLASS_NAMES: Record<string, string> = { '7': '7th Grade', '8': '8th Grade' }

// Grade is the source of truth; class_name is always derived from it so the two cannot diverge.
function resolveGradeAndClassName(payload: StudentMutationPayload) {
  const grade = normalizeStudentGrade(payload.grade) || normalizeStudentGrade(payload.className) || normalizeStudentGrade(payload.classId)
  const className = GRADE_CLASS_NAMES[grade] || String(payload.className || '').trim()
  return { grade, className }
}

async function appendAuditLog(action: string, targetId: number | string, userName: string, metadata: Record<string, unknown>) {
  await supabase
    .from('audit_logs')
    .insert({
      user_name: String(userName || '').trim() || 'Unknown',
      action,
      target_table: 'students',
      target_id: String(targetId),
      metadata,
    })
}

export async function createStudentRecord(payload: StudentMutationPayload, actorName: string) {
  const family = normalizeFamilyDetails(payload.family)
  const teacherAssignments = normalizeAssignments(payload.teacherAssignments)
  const supportAssignments = normalizeAssignments(payload.supportAssignments)
  const { grade, className } = resolveGradeAndClassName(payload)

  const services = [
    ...teacherAssignments.map(name => ({ role: 'teacher', staffName: name })),
    ...supportAssignments.map(name => ({ role: 'support_staff', staffName: name })),
  ]

  const row = {
    name: String(payload.name || '').trim(),
    class_name: className,
    status: String(payload.status || 'present'),
    daily_status: String(payload.status || 'present'),
    division: 'yeshiva-ketana',
    token_balance: 0,
    reminders: 0,
    attendance: [],
    notes: [],
    behavior_log: [],
    parent_calls: [],
    test_scores: [],
    class_log: [],
    services,
    breakfast: [],
    detention: false,
    iep: false,
    iep_details: '',
    medical: {},
    family,
    therapy_assignments: [],
    assigned_therapist: String(payload.assignedTherapist || '').trim(),
    therapy_frequency: String(payload.therapyFrequency || '').trim(),
    therapy_notes: String(payload.therapyNotes || '').trim(),
    is_active: payload.isActive !== false,
    grade,
    archived_at: payload.isActive === false ? new Date().toISOString() : null,
    archived_by: payload.isActive === false ? actorName : null,
  }

  const { data, error } = await supabase
    .from('students')
    .insert(row)
    .select('*')
    .single()

  if (error) throw error

  await appendAuditLog('student_created', data.id, actorName, {
    className: row.class_name,
    isActive: row.is_active,
    teacherAssignments,
    supportAssignments,
  })

  return data
}

export async function updateStudentRecord(studentId: number, payload: StudentMutationPayload, actorName: string) {
  const family = normalizeFamilyDetails(payload.family)
  const teacherAssignments = normalizeAssignments(payload.teacherAssignments)
  const supportAssignments = normalizeAssignments(payload.supportAssignments)
  const { grade, className } = resolveGradeAndClassName(payload)

  const services = [
    ...teacherAssignments.map(name => ({ role: 'teacher', staffName: name })),
    ...supportAssignments.map(name => ({ role: 'support_staff', staffName: name })),
  ]

  const patch = {
    name: String(payload.name || '').trim(),
    class_name: className,
    status: String(payload.status || 'present'),
    daily_status: String(payload.status || 'present'),
    family,
    services,
    assigned_therapist: String(payload.assignedTherapist || '').trim(),
    therapy_frequency: String(payload.therapyFrequency || '').trim(),
    therapy_notes: String(payload.therapyNotes || '').trim(),
    is_active: payload.isActive !== false,
    grade,
    archived_at: payload.isActive === false ? new Date().toISOString() : null,
    archived_by: payload.isActive === false ? actorName : null,
  }

  const { data, error } = await supabase
    .from('students')
    .update(patch)
    .eq('id', studentId)
    .select('*')
    .single()

  if (error) throw error

  await appendAuditLog('student_updated', studentId, actorName, {
    className: patch.class_name,
    grade,
    isActive: patch.is_active,
    teacherAssignments,
    supportAssignments,
  })

  return data
}

export async function archiveStudentRecord(studentId: number, actorName: string) {
  const patch = {
    is_active: false,
    archived_at: new Date().toISOString(),
    archived_by: actorName,
  }

  const { data, error } = await supabase
    .from('students')
    .update(patch)
    .eq('id', studentId)
    .select('*')
    .single()

  if (error) throw error

  await appendAuditLog('student_archived', studentId, actorName, {})

  return data
}

export async function restoreStudentRecord(studentId: number, actorName: string) {
  const patch = {
    is_active: true,
    archived_at: null,
    archived_by: null,
  }

  const { data, error } = await supabase
    .from('students')
    .update(patch)
    .eq('id', studentId)
    .select('*')
    .single()

  if (error) throw error

  await appendAuditLog('student_restored', studentId, actorName, {})

  return data
}

export async function getStudentDeletionImpact(studentId: number): Promise<DeletionImpact> {
  const countByTable = async (table: string, column: string) => {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(column, studentId)
    return Number(count || 0)
  }

  const pointsHistoryRows = await countByTable('points_events', 'student_id')
  const storeRedemptionsRows = await countByTable('store_redemptions', 'student_id')
  const classAssignmentsRows = await countByTable('student_class_assignments', 'student_id')
  const supportRows = await countByTable('support_sessions', 'student_id')
  const assignmentRows = await countByTable('teacher_rebbe_assignments', 'student_id')
  const notesRows = await countByTable('student_notes', 'student_id')

  return {
    attendanceHistoryRows: 1,
    notesRows,
    pointsHistoryRows,
    storeRedemptionsRows,
    classAssignmentsRows,
    supportRows,
    assignmentRows,
    relatedActivityRows: pointsHistoryRows + storeRedemptionsRows + classAssignmentsRows + supportRows + assignmentRows + notesRows,
  }
}

export async function permanentlyDeleteStudentRecord(studentId: number, actorName: string) {
  void studentId
  void actorName
  throw new Error('Permanent student deletion is disabled for Yeshiva Ketana. Archive the student instead.')
}
