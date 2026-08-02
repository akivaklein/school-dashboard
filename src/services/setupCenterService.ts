import { supabase } from '../supabaseClient'

/**
 * Teaching Actions - Custom point reward/deduction categories
 */

export type TeachingAction = {
  id: string
  label: string
  points: number
  category: string
  created_at?: string
  updated_at?: string
}

export async function listTeachingActions(): Promise<TeachingAction[]> {
  const { data, error } = await supabase
    .from('teaching_actions')
    .select('*')
    .order('category', { ascending: true })
    .order('label', { ascending: true })

  if (error) {
    console.error('Error fetching teaching actions:', error)
    throw new Error(error.message || 'Unable to fetch teaching actions')
  }

  return (data || []).map(row => ({
    id: row.id,
    label: row.label,
    points: row.points,
    category: row.category,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export async function createTeachingAction(input: {
  label: string
  points: number
  category: string
}): Promise<TeachingAction> {
  const { data, error } = await supabase
    .from('teaching_actions')
    .insert([
      {
        id: `action-${Date.now()}`,
        label: input.label,
        points: input.points,
        category: input.category,
      }
    ])
    .select('*')
    .single()

  if (error) {
    console.error('Error creating teaching action:', error)
    throw new Error(error.message || 'Unable to create teaching action')
  }

  return {
    id: data.id,
    label: data.label,
    points: data.points,
    category: data.category,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function deleteTeachingAction(id: string): Promise<void> {
  const { error } = await supabase
    .from('teaching_actions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting teaching action:', error)
    throw new Error(error.message || 'Unable to delete teaching action')
  }
}

/**
 * VIP Rules - Eligibility thresholds (singleton config)
 */

export type VIPRules = {
  id: string
  minimum_points: number
  maximum_reminders: number
  minimum_attendance: number
  require_all: boolean
  updated_at?: string
}

export async function getVIPRules(): Promise<VIPRules> {
  const { data, error } = await supabase
    .from('vip_rules')
    .select('*')
    .eq('id', 'default')
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is expected if not yet created
    console.error('Error fetching VIP rules:', error)
    throw new Error(error.message || 'Unable to fetch VIP rules')
  }

  // Return defaults if not found
  if (!data) {
    return {
      id: 'default',
      minimum_points: 80,
      maximum_reminders: 2,
      minimum_attendance: 90,
      require_all: true,
    }
  }

  return {
    id: data.id,
    minimum_points: data.minimum_points,
    maximum_reminders: data.maximum_reminders,
    minimum_attendance: data.minimum_attendance,
    require_all: data.require_all,
    updated_at: data.updated_at,
  }
}

export async function updateVIPRules(input: Partial<Omit<VIPRules, 'id' | 'updated_at'>>): Promise<VIPRules> {
  const { data, error } = await supabase
    .from('vip_rules')
    .upsert({
      id: 'default',
      minimum_points: input.minimum_points ?? 80,
      maximum_reminders: input.maximum_reminders ?? 2,
      minimum_attendance: input.minimum_attendance ?? 90,
      require_all: input.require_all ?? true,
    }, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating VIP rules:', error)
    throw new Error(error.message || 'Unable to update VIP rules')
  }

  return {
    id: data.id,
    minimum_points: data.minimum_points,
    maximum_reminders: data.maximum_reminders,
    minimum_attendance: data.minimum_attendance,
    require_all: data.require_all,
    updated_at: data.updated_at,
  }
}

/**
 * Store Sales - Promotions and discounts
 */

export type StoreSale = {
  id: string
  name: string
  type: 'points-off' | 'percent-off' | 'vip-special'
  value: number
  active: boolean
  created_at?: string
  updated_at?: string
}

export async function listStoreSales(): Promise<StoreSale[]> {
  const { data, error } = await supabase
    .from('store_sales')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching store sales:', error)
    throw new Error(error.message || 'Unable to fetch store sales')
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    value: row.value,
    active: row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export async function createStoreSale(input: {
  name: string
  type: 'points-off' | 'percent-off' | 'vip-special'
  value: number
}): Promise<StoreSale> {
  const { data, error } = await supabase
    .from('store_sales')
    .insert([
      {
        id: `sale-${Date.now()}`,
        name: input.name,
        type: input.type,
        value: input.value,
        active: true,
      }
    ])
    .select('*')
    .single()

  if (error) {
    console.error('Error creating store sale:', error)
    throw new Error(error.message || 'Unable to create store sale')
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    value: data.value,
    active: data.active,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function updateStoreSale(
  id: string,
  updates: Partial<Omit<StoreSale, 'id' | 'created_at' | 'updated_at'>>
): Promise<StoreSale> {
  const { data, error } = await supabase
    .from('store_sales')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.value !== undefined && { value: updates.value }),
      ...(updates.active !== undefined && { active: updates.active }),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating store sale:', error)
    throw new Error(error.message || 'Unable to update store sale')
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    value: data.value,
    active: data.active,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function deleteStoreSale(id: string): Promise<void> {
  const { error } = await supabase
    .from('store_sales')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting store sale:', error)
    throw new Error(error.message || 'Unable to delete store sale')
  }
}

/**
 * Setup Center Persistence
 * Staff assignments, therapy schedules, and account settings
 */

// Staff Assignments
export async function loadSetupAssignments() {
  const { data, error } = await supabase
    .from('setup_assignments')
    .select('staff_name, assignments_data')

  if (error) {
    console.error('Error loading setup assignments:', error)
    return {}
  }

  const result: Record<string, any> = {}
  data?.forEach(row => {
    if (String(row.staff_name || '').startsWith('__')) return
    result[row.staff_name] = row.assignments_data || {
      periods: { 1: [], 2: [], 3: [] },
      caseload: []
    }
  })

  return result
}

export async function saveSetupAssignment(staffName: string, assignmentData: any) {
  const { error } = await supabase
    .from('setup_assignments')
    .upsert({
      staff_name: staffName,
      assignments_data: assignmentData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'staff_name' })

  if (error) {
    console.error(`Error saving assignment for ${staffName}:`, error)
    return false
  }
  return true
}

// Teacher/Rebbe assignments (separate from primary class/division)
export type TeacherRebbeAssignment = {
  id: string
  student_id: number
  teacher_name: string
  subject: string
  class_or_group: string
  period: string
  weekdays: string[]
  start_date: string | null
  end_date: string | null
  assignment_type: 'primary' | 'additional'
  status: 'active' | 'inactive'
  updated_by: string
  created_at?: string
  updated_at?: string
}

function normalizeAssignmentWeekdays(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(day => String(day || '').trim()).filter(Boolean)
}

function mapTeacherRebbeAssignment(row: any): TeacherRebbeAssignment {
  return {
    id: String(row.id),
    student_id: Number(row.student_id),
    teacher_name: String(row.teacher_name || ''),
    subject: String(row.subject || ''),
    class_or_group: String(row.class_or_group || ''),
    period: String(row.period || ''),
    weekdays: normalizeAssignmentWeekdays(row.weekdays),
    start_date: row.start_date ? String(row.start_date) : null,
    end_date: row.end_date ? String(row.end_date) : null,
    assignment_type: row.assignment_type === 'primary' ? 'primary' : 'additional',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    updated_by: String(row.updated_by || 'System'),
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  }
}

export function buildTeacherRebbeAssignmentId(input: {
  studentId: number
  teacherName: string
  subject: string
  classOrGroup: string
  period: string
  assignmentType: 'primary' | 'additional'
}) {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return [
    'tra',
    String(input.studentId),
    normalize(input.teacherName),
    normalize(input.subject || 'general'),
    normalize(input.classOrGroup || 'class'),
    normalize(input.period || 'period'),
    input.assignmentType,
  ].join('-')
}

export async function loadTeacherRebbeAssignments(): Promise<TeacherRebbeAssignment[]> {
  const { data, error } = await supabase
    .from('teacher_rebbe_assignments')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error loading teacher/rebbe assignments:', error)
    return []
  }

  return (data || []).map(mapTeacherRebbeAssignment)
}

export async function upsertTeacherRebbeAssignment(input: {
  id?: string
  student_id: number
  teacher_name: string
  subject: string
  class_or_group: string
  period: string
  weekdays?: string[]
  start_date?: string | null
  end_date?: string | null
  assignment_type?: 'primary' | 'additional'
  status?: 'active' | 'inactive'
  updated_by: string
}): Promise<TeacherRebbeAssignment | null> {
  const assignmentType = input.assignment_type || 'additional'
  const id = input.id || buildTeacherRebbeAssignmentId({
    studentId: input.student_id,
    teacherName: input.teacher_name,
    subject: input.subject,
    classOrGroup: input.class_or_group,
    period: input.period,
    assignmentType,
  })

  const { data, error } = await supabase
    .from('teacher_rebbe_assignments')
    .upsert({
      id,
      student_id: input.student_id,
      teacher_name: input.teacher_name,
      subject: input.subject,
      class_or_group: input.class_or_group,
      period: input.period,
      weekdays: input.weekdays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      assignment_type: assignmentType,
      status: input.status || 'active',
      updated_by: input.updated_by,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    console.error('Error upserting teacher/rebbe assignment:', error)
    return null
  }

  return mapTeacherRebbeAssignment(data)
}

export async function setTeacherRebbeAssignmentStatus(
  id: string,
  status: 'active' | 'inactive',
  updatedBy: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('teacher_rebbe_assignments')
    .update({
      status,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating teacher/rebbe assignment status:', error)
    return false
  }

  return true
}

// Therapy Schedule
export async function loadTherapySchedule() {
  const { data, error } = await supabase
    .from('therapy_schedule')
    .select('schedule_data')
    .eq('id', 1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading therapy schedule:', error)
    return []
  }

  return data?.schedule_data || []
}

export async function saveTherapySchedule(scheduleData: any) {
  const { error } = await supabase
    .from('therapy_schedule')
    .upsert({
      id: 1,
      schedule_data: scheduleData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (error) {
    console.error('Error saving therapy schedule:', error)
    return false
  }
  return true
}

// Staff Accounts
export async function loadStaffAccounts() {
  const { data, error } = await supabase
    .from('staff_accounts')
    .select('staff_name, account_data')

  if (error) {
    console.error('Error loading staff accounts:', error)
    return {}
  }

  const result: Record<string, any> = {}
  data?.forEach(row => {
    result[row.staff_name] = row.account_data || { active: true, divisions: 'both' }
  })

  return result
}

export async function saveStaffAccount(staffName: string, accountData: any) {
  const { error } = await supabase
    .from('staff_accounts')
    .upsert({
      staff_name: staffName,
      account_data: accountData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'staff_name' })

  if (error) {
    console.error(`Error saving account for ${staffName}:`, error)
    return false
  }
  return true
}

/**
 * Academic Catalog - Subjects and skills/topics configuration
 * Persisted using setup_assignments table with an internal key row to avoid new schema work.
 */

const ACADEMIC_CATALOG_ROW_KEY = '__academic_catalog__'

export type AcademicCatalogSkill = {
  id: string
  label: string
  active: boolean
}

export type AcademicCatalogSubject = {
  id: string
  label: string
  active: boolean
  divisionKeys: string[]
  classIds: string[]
  teacherNames: string[]
  skills: AcademicCatalogSkill[]
}

export type AcademicCatalogConfig = {
  subjects: AcademicCatalogSubject[]
}

function parseAcademicCatalog(raw: unknown): AcademicCatalogConfig | null {
  if (!raw || typeof raw !== 'object') return null

  const subjects = Array.isArray((raw as any).subjects) ? (raw as any).subjects : []

  return {
    subjects: subjects
      .filter((subject: any) => subject && typeof subject.label === 'string')
      .map((subject: any) => ({
        id: String(subject.id || `subject-${Date.now()}`),
        label: String(subject.label || '').trim(),
        active: subject.active !== false,
        divisionKeys: Array.isArray(subject.divisionKeys) ? subject.divisionKeys.map((value: any) => String(value)) : [],
        classIds: Array.isArray(subject.classIds) ? subject.classIds.map((value: any) => String(value)) : [],
        teacherNames: Array.isArray(subject.teacherNames) ? subject.teacherNames.map((value: any) => String(value)) : [],
        skills: Array.isArray(subject.skills)
          ? subject.skills
              .filter((skill: any) => skill && typeof skill.label === 'string')
              .map((skill: any) => ({
                id: String(skill.id || `skill-${Date.now()}`),
                label: String(skill.label || '').trim(),
                active: skill.active !== false,
              }))
          : [],
      })),
  }
}

type SetupAssignmentsRow = {
  staff_name: string
  assignments_data: unknown
}

export async function loadSetupAssignmentsBundle(): Promise<{
  assignments: Record<string, any>
  academicCatalog: AcademicCatalogConfig | null
}> {
  let rows: SetupAssignmentsRow[] = []

  try {
    const { data, error } = await supabase
      .from('setup_assignments')
      .select('staff_name, assignments_data')

    if (error) {
      console.error('Error loading setup assignments bundle:', error)
      return { assignments: {}, academicCatalog: null }
    }

    rows = Array.isArray(data) ? (data as SetupAssignmentsRow[]) : []
  } catch (caughtError) {
    console.error('Setup assignments bundle request failed before Supabase response:', caughtError)
    return { assignments: {}, academicCatalog: null }
  }

  const assignments: Record<string, any> = {}
  let academicCatalog: AcademicCatalogConfig | null = null

  rows.forEach(row => {
    const staffName = String(row.staff_name || '')

    if (staffName === ACADEMIC_CATALOG_ROW_KEY) {
      academicCatalog = parseAcademicCatalog(row.assignments_data)
      return
    }

    if (staffName.startsWith('__')) return

    assignments[staffName] = row.assignments_data || {
      periods: { 1: [], 2: [], 3: [] },
      caseload: [],
    }
  })

  return { assignments, academicCatalog }
}

export async function loadAcademicCatalog(): Promise<AcademicCatalogConfig | null> {
  let data: { assignments_data?: unknown } | null = null
  let error: { message?: string } | null = null

  try {
    const response = await supabase
      .from('setup_assignments')
      .select('assignments_data')
      .eq('staff_name', ACADEMIC_CATALOG_ROW_KEY)
      .maybeSingle()

    data = response.data as { assignments_data?: unknown } | null
    error = response.error
  } catch (caughtError) {
    console.error('Academic catalog request failed before Supabase response:', caughtError)
    return null
  }

  if (error) {
    console.error('Error loading academic catalog:', error)
    return null
  }

  return parseAcademicCatalog(data?.assignments_data)
}

export async function saveAcademicCatalog(config: AcademicCatalogConfig): Promise<boolean> {
  const sanitizedConfig: AcademicCatalogConfig = {
    subjects: (config?.subjects || []).map(subject => ({
      id: String(subject.id),
      label: String(subject.label || '').trim(),
      active: subject.active !== false,
      divisionKeys: Array.isArray(subject.divisionKeys) ? subject.divisionKeys.map(value => String(value)) : [],
      classIds: Array.isArray(subject.classIds) ? subject.classIds.map(value => String(value)) : [],
      teacherNames: Array.isArray(subject.teacherNames) ? subject.teacherNames.map(value => String(value)) : [],
      skills: (subject.skills || []).map(skill => ({
        id: String(skill.id),
        label: String(skill.label || '').trim(),
        active: skill.active !== false,
      })),
    })),
  }

  let error: { message?: string } | null = null

  try {
    const response = await supabase
      .from('setup_assignments')
      .upsert({
        staff_name: ACADEMIC_CATALOG_ROW_KEY,
        assignments_data: sanitizedConfig,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'staff_name' })

    error = response.error
  } catch (caughtError) {
    console.error('Academic catalog save request failed before Supabase response:', caughtError)
    return false
  }

  if (error) {
    console.error('Error saving academic catalog:', error)
    return false
  }

  return true
}

  export async function renameSetupStaffReferences(oldName: string, newName: string) {
    if (!oldName || !newName || oldName === newName) return true

    try {
      const { data: assignmentRow, error: assignmentLoadError } = await supabase
        .from('setup_assignments')
        .select('assignments_data')
        .eq('staff_name', oldName)
        .maybeSingle()

      if (assignmentLoadError) {
        console.error('Error loading setup assignment to rename:', assignmentLoadError)
        return false
      }

      if (assignmentRow) {
        const assignmentSaved = await saveSetupAssignment(newName, assignmentRow.assignments_data || {
          periods: { 1: [], 2: [], 3: [] },
          caseload: [],
        })

        if (!assignmentSaved) return false

        const { error: assignmentDeleteError } = await supabase
          .from('setup_assignments')
          .delete()
          .eq('staff_name', oldName)

        if (assignmentDeleteError) {
          console.error('Error deleting old setup assignment row:', assignmentDeleteError)
          return false
        }
      }

      const { data: accountRow, error: accountLoadError } = await supabase
        .from('staff_accounts')
        .select('account_data')
        .eq('staff_name', oldName)
        .maybeSingle()

      if (accountLoadError) {
        console.error('Error loading staff account to rename:', accountLoadError)
        return false
      }

      if (accountRow) {
        const accountSaved = await saveStaffAccount(newName, accountRow.account_data || {
          active: true,
          divisions: 'both',
        })

        if (!accountSaved) return false

        const { error: accountDeleteError } = await supabase
          .from('staff_accounts')
          .delete()
          .eq('staff_name', oldName)

        if (accountDeleteError) {
          console.error('Error deleting old staff account row:', accountDeleteError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error renaming setup staff references:', error)
      return false
    }
  }
