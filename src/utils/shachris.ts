export type ShachrisSection = { id: string; label: string }
export type ShachrisMilestone = { id: string; label: string; sectionIds: string[] }
export type ShachrisRule = { id: string; grade: string; minAge: number | null; maxAge: number | null; milestoneId: string }
export type ShachrisConfig = {
  sections: ShachrisSection[]
  milestones: ShachrisMilestone[]
  ratings: Array<{ id: string; label: string }>
  rules: ShachrisRule[]
  fallbackMilestoneId: string
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
  presence: 'unmarked' | 'present' | 'absent' | 'left'
  said_section_ids: string[]
  rating_id: string
  note: string
  revision: number
  updated_by_name: string
  updated_at?: string
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

export function resolveShachrisExpectation(config: ShachrisConfig, assignment: ShachrisAssignment | undefined, age: number | null, grade: string): ShachrisExpectation {
  const manual = assignment?.mode === 'manual'
  const rule = config.rules.find(entry => (!entry.grade || entry.grade === grade)
    && (entry.minAge === null || (age !== null && age >= entry.minAge))
    && (entry.maxAge === null || (age !== null && age <= entry.maxAge)))
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
  if (config.rules.some(rule => !milestoneIds.has(rule.milestoneId) || [rule.minAge, rule.maxAge].some(age => age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) || (rule.minAge !== null && rule.maxAge !== null && rule.minAge > rule.maxAge))) return 'Check the ages and milestones in your default rules.'
  return null
}