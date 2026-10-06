export type ShachrisSection = { id: string; label: string }
export type ShachrisMilestone = { id: string; label: string; sectionIds: string[] }
export type ShachrisRule = { id: string; grade: '7' | '8'; milestoneId: string }
export type ShachrisStayMilestone = { id: string; label: string; order: number }
export type ShachrisStayRule = { id: string; age: 11 | 12 | 13; milestoneId: string }
export type ShachrisConfig = {
  sections: ShachrisSection[]
  milestones: ShachrisMilestone[]
  ratings: Array<{ id: string; label: string }>
  rules: ShachrisRule[]
  fallbackMilestoneId: string
  stayMilestones: ShachrisStayMilestone[]
  stayRules: ShachrisStayRule[]
}
export type ShachrisStayAssignment = {
  id: string
  student_id: number
  mode: 'manual' | 'default'
  required_until: string | null
  reason: string
  actor_name: string
  effective_date: string
  duration: 'today' | 'future'
  created_at: string
}
export type ShachrisStayRequirement = {
  age: number | null
  requiredUntil: string | null
  label: string
  source: 'manual' | 'default' | 'unassigned'
  duration?: 'today' | 'future'
}
export type ShachrisExpectation = {
  milestoneId: string
  label: string
  sectionIds: string[]
  source: 'manual' | 'default'
  duration?: 'today' | 'future'
}
export type ShachrisAssignment = {
  id: string
  student_id: number
  mode: 'manual' | 'default'
  milestone_id: string | null
  section_ids: string[] | null
  reason: string
  actor_name: string
  effective_date: string
  duration: 'today' | 'future'
  created_at: string
}
export type ShachrisRecord = {
  session_id: string
  student_id: number
  expectation: ShachrisExpectation
  stay_requirement: ShachrisStayRequirement
  presence: 'unmarked' | 'present' | 'absent' | 'left'
  arrival_at: string | null
  last_return_at: string | null
  leave_intervals: Array<{ leftAt: string; returnedAt: string | null; permission: 'with' | 'without' }>
  requirement_result: 'pending' | 'met' | 'not_met'
  requirement_met_at: string | null
  requirement_met_milestone: string | null
  said_section_ids: string[]
  rating_id: string
  note: string
  revision: number
  updated_by_name: string
  updated_at?: string
  late_minutes?: number | null
  late_reason?: 'transportation' | 'excused' | 'no_reason' | 'other' | null
  late_reason_note?: string
  late_excused?: boolean
  absence_status?: 'absent' | 'excused' | 'not_in_shul' | null
  personally_cleared_at?: string | null
  personally_cleared_by_name?: string
  personally_cleared_milestone?: string | null
  extra_stay_intervals?: Array<{ startedAt: string; endedAt: string | null }>
  stayed_beyond_required?: boolean
}

export function isShachrisLate(startedAt: string | null | undefined, arrivalAt: string | null | undefined): boolean {
  return Boolean(startedAt && arrivalAt && Date.parse(arrivalAt) > Date.parse(startedAt))
}

export function isShachrisReadyForCheck(record: ShachrisRecord, milestoneTimes: Record<string, string>): boolean {
  return Boolean(!record.personally_cleared_at && record.presence === 'present' && record.stay_requirement.requiredUntil && milestoneTimes[record.stay_requirement.requiredUntil])
}

export function shachrisPresenceLabel(record: ShachrisRecord): string {
  if (record.presence === 'present') return 'In Shul'
  if (record.presence === 'left') return 'Out / Left'
  if (record.presence === 'absent') return record.absence_status === 'excused' ? 'Excused from Shul' : record.absence_status === 'not_in_shul' ? 'Not in Shul' : 'Absent'
  return 'Not Marked'
}

export function needsShachrisAttention(record: ShachrisRecord, startedAt: string | null | undefined): boolean {
  if (!startedAt || record.absence_status === 'excused') return false
  return !record.stay_requirement.requiredUntil || record.presence === 'unmarked' || record.presence === 'absent'
    || record.presence === 'left' && !record.personally_cleared_at
    || isShachrisLate(startedAt, record.arrival_at) && !record.late_excused
}

export function calculateShachrisExtraSeconds(record: ShachrisRecord, now = Date.now()): number {
  return (record.extra_stay_intervals || []).reduce((total, interval) => {
    const seconds = Math.floor(((interval.endedAt ? Date.parse(interval.endedAt) : now) - Date.parse(interval.startedAt)) / 1000)
    return total + (Number.isFinite(seconds) ? Math.max(0, seconds) : 0)
  }, 0)
}

export function personallyClearShachrisRecord(record: ShachrisRecord, milestoneTimes: Record<string, string>, at: string, actorName: string): ShachrisRecord {
  if (record.personally_cleared_at) return record
  if (!isShachrisReadyForCheck(record, milestoneTimes)) throw new Error('Student must be In Shul and the required communal milestone must have passed.')
  return { ...record, requirement_result: 'met', requirement_met_at: at, requirement_met_milestone: record.stay_requirement.requiredUntil,
    personally_cleared_at: at, personally_cleared_by_name: actorName, personally_cleared_milestone: record.stay_requirement.requiredUntil,
    extra_stay_intervals: [...(record.extra_stay_intervals || []), { startedAt: at, endedAt: null }] }
}

export const INITIAL_SHACHRIS_CONFIG: ShachrisConfig = {
  sections: [
    { id: 'baruch-sheamar', label: 'Baruch Sheamar' },
    { id: 'ashrei', label: 'Ashrei' },
    { id: 'shema', label: 'Shema' },
    { id: 'shemoneh-esrei', label: 'Shemoneh Esrei' },
  ],
  milestones: [
    { id: 'start', label: 'Baruch Sheamar', sectionIds: ['baruch-sheamar'] },
    { id: 'ashrei', label: 'Through Ashrei', sectionIds: ['baruch-sheamar', 'ashrei'] },
    { id: 'shema', label: 'Through Shema', sectionIds: ['baruch-sheamar', 'ashrei', 'shema'] },
    { id: 'full', label: 'Through Shemoneh Esrei', sectionIds: ['baruch-sheamar', 'ashrei', 'shema', 'shemoneh-esrei'] },
  ],
  ratings: [{ id: 'vg', label: 'Very Good' }, { id: 'g', label: 'Good' }, { id: 'ni', label: 'Needs Improvement' }],
  rules: [],
  fallbackMilestoneId: 'start',
  stayMilestones: [
    { id: 'hodu', label: 'Start Hodu', order: 0 },
    { id: 'shemoneh-esrei', label: 'After Shemoneh Esrei', order: 1 },
    { id: 'chazaras-hashatz', label: 'After Chazaras HaShatz', order: 2 },
    { id: 'end-davening', label: 'End Davening', order: 3 },
  ],
  stayRules: [
    { id: 'age-11', age: 11, milestoneId: 'shemoneh-esrei' },
    { id: 'age-12', age: 12, milestoneId: 'chazaras-hashatz' },
    { id: 'age-13', age: 13, milestoneId: 'end-davening' },
  ],
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function calculateAge(dob: string | null | undefined, onDate = localDateKey()): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || !/^\d{4}-\d{2}-\d{2}$/.test(onDate)) return null
  const [year, month, day] = dob.split('-').map(Number)
  const [currentYear, currentMonth, currentDay] = onDate.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day || dob > onDate) return null
  return currentYear - year - (currentMonth < month || (currentMonth === month && currentDay < day) ? 1 : 0)
}

export function resolveShachrisStayRequirement(config: ShachrisConfig, assignment: ShachrisStayAssignment | undefined, age: number | null): ShachrisStayRequirement {
  const manual = assignment?.mode === 'manual'
  const rule = manual ? null : config.stayRules.find(entry => entry.age === age)
  const requiredUntil = manual ? assignment.required_until : rule?.milestoneId || null
  const milestone = config.stayMilestones.find(entry => entry.id === requiredUntil)
  return {
    age,
    requiredUntil,
    label: milestone?.label || (manual ? 'Requirement not set' : 'No age default'),
    source: manual ? 'manual' : rule ? 'default' : 'unassigned',
    ...(manual ? { duration: assignment.duration } : {}),
  }
}

function durationMinutes(start: string | null | undefined, end: string | null | undefined, now = Date.now()): number {
  if (!start) return 0
  const startMs = Date.parse(start)
  const endMs = end ? Date.parse(end) : now
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return 0
  return Math.floor((endMs - startMs) / 60000)
}

export function calculateShachrisMinutesLate(startedAt: string | null | undefined, arrivalAt: string | null | undefined): number | null {
  if (!startedAt || !arrivalAt) return null
  return durationMinutes(startedAt, arrivalAt)
}

export function calculateShachrisMinutesOut(intervals: ShachrisRecord['leave_intervals'], now = Date.now()): number {
  return intervals.reduce((total, interval) => total + durationMinutes(interval.leftAt, interval.returnedAt, now), 0)
}

export function latestOpenShachrisLeave(intervals: ShachrisRecord['leave_intervals']) {
  return [...intervals].reverse().find(interval => interval.returnedAt === null) || null
}

export function getShachrisGrade(primaryClassId: string | null | undefined): '7' | '8' | '' {
  return primaryClassId === 'yk-a' ? '8' : primaryClassId === 'yk-b' ? '7' : ''
}

export function resolveShachrisExpectation(config: ShachrisConfig, assignment: ShachrisAssignment | undefined, primaryClassId: string | null | undefined): ShachrisExpectation {
  const manual = assignment?.mode === 'manual'
  const grade = getShachrisGrade(primaryClassId)
  const rule = config.rules.find(entry => entry.grade === grade)
  const milestoneId = manual ? assignment.milestone_id : rule?.milestoneId || config.fallbackMilestoneId
  const milestone = config.milestones.find(entry => entry.id === milestoneId)
  if (!milestone) throw new Error('The assigned milestone no longer exists. Review this student in Rules & Settings.')
  const sectionIds = manual && assignment.section_ids !== null ? assignment.section_ids : milestone.sectionIds
  return { milestoneId: milestone.id, label: milestone.label, sectionIds: [...sectionIds], source: manual ? 'manual' : 'default' }
}

export function nextShachrisSection(config: ShachrisConfig, expectation: ShachrisExpectation): ShachrisSection | null {
  return config.sections.find(section => !expectation.sectionIds.includes(section.id)) || null
}

export function completeShachrisExpectation(record: ShachrisRecord): ShachrisRecord {
  return { ...record, said_section_ids: Array.from(new Set([...record.said_section_ids, ...record.expectation.sectionIds])) }
}

export function completePresentShachrisRequirements(records: ShachrisRecord[]): ShachrisRecord[] {
  return records.filter(record => record.presence === 'present' && !hasMetShachrisExpectation(record)).map(completeShachrisExpectation)
}

export function hasMetShachrisExpectation(record: ShachrisRecord): boolean {
  return record.expectation.sectionIds.length > 0 && record.expectation.sectionIds.every(sectionId => record.said_section_ids.includes(sectionId))
}

export function validateShachrisConfig(config: ShachrisConfig): string | null {
  const unique = (ids: string[]) => ids.every(Boolean) && new Set(ids).size === ids.length
  if (!config.sections.length || !unique(config.sections.map(section => section.id)) || config.sections.some(section => !section.label.trim())) return 'Sections must have unique IDs and nonempty names.'
  if (!config.milestones.length || !unique(config.milestones.map(milestone => milestone.id))) return 'Add at least one milestone with a unique ID.'
  const sectionIds = new Set(config.sections.map(section => section.id))
  if (config.milestones.some(milestone => !milestone.label.trim() || !milestone.sectionIds.length || !unique(milestone.sectionIds) || milestone.sectionIds.some(sectionId => !sectionIds.has(sectionId)))) return 'Each milestone needs a name and at least one valid required section.'
  const milestoneIds = new Set(config.milestones.map(milestone => milestone.id))
  if (!milestoneIds.has(config.fallbackMilestoneId)) return 'Choose a valid school fallback.'
  if (!config.ratings.length || !unique(config.ratings.map(rating => rating.id)) || config.ratings.some(rating => !rating.label.trim())) return 'Ratings need unique IDs and nonempty names.'
  if (!config.stayMilestones.length || !unique(config.stayMilestones.map(milestone => milestone.id)) || !unique(config.stayMilestones.map(milestone => String(milestone.order)))
    || config.stayMilestones.some(milestone => !milestone.label.trim() || !Number.isInteger(milestone.order))) return 'Communal Shachris milestones must have unique IDs, order, and names.'
  if (new Set(config.stayRules.map(rule => rule.age)).size !== config.stayRules.length || !unique(config.stayRules.map(rule => rule.id))
    || config.stayRules.some(rule => ![11, 12, 13].includes(rule.age) || !config.stayMilestones.some(milestone => milestone.id === rule.milestoneId && milestone.order > 0))) return 'Age requirements must map ages 11, 12, or 13 to a communal milestone after Hodu.'
  if (!unique(config.rules.map(rule => rule.id)) || new Set(config.rules.map(rule => rule.grade)).size !== config.rules.length
    || config.rules.some(rule => !['7', '8'].includes(rule.grade) || !milestoneIds.has(rule.milestoneId) || Object.keys(rule).some(key => !['id', 'grade', 'milestoneId'].includes(key)))) return 'Default rules must use one rule per actual grade (7th or 8th) and a valid milestone.'
  return null
}