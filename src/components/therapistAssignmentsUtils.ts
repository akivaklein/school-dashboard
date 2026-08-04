export type AssignmentRow = {
  id: string
  provider: string
  serviceType: string
  day: string
  date: string
  startTime: string
  endTime: string
  recurrence: string
  affectedPeriod: string
  customDays?: string[]
  notes: string
  active: boolean
}

type AssignmentWithStudent = {
  studentId: string | number
  studentName: string
  assignment: AssignmentRow
}

type TimeParts = {
  hour12: string
  minute: string
  meridiem: 'AM' | 'PM'
}

const WEEKDAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const SCHOOL_DAY_START_MINUTES = 7 * 60
const SCHOOL_DAY_END_MINUTES = 17 * 60

const PROVIDER_SERVICE_DEFAULTS: Record<string, string> = {
  'aryeh schechter': 'OT',
  'tzvi malks': 'PT',
  'yitzi liebowitz': 'Speech',
  'shelly wagschal': 'Counseling',
  ezriel: 'BT Support',
  tuli: 'BT Support',
  avrumi: 'BT Support',
  eliyahu: 'BT Support',
  yaakov: 'BT Support',
  elan: 'BT Support',
  nussi: 'BT Support',
  dovid: 'BT Support',
}

function cleanText(value: unknown): string {
  return String(value || '').trim()
}

function normalizeDay(value: string): string {
  const lowered = String(value || '').trim().toLowerCase()
  const map: Record<string, string> = {
    mon: 'Monday',
    monday: 'Monday',
    tue: 'Tuesday',
    tues: 'Tuesday',
    tuesday: 'Tuesday',
    wed: 'Wednesday',
    wednesday: 'Wednesday',
    thu: 'Thursday',
    thur: 'Thursday',
    thurs: 'Thursday',
    thursday: 'Thursday',
    fri: 'Friday',
    friday: 'Friday',
  }
  return map[lowered] || ''
}

function assignmentDays(row: AssignmentRow): string[] {
  if (String(row.recurrence || '').toLowerCase() === 'custom') {
    return (Array.isArray(row.customDays) ? row.customDays : [])
      .map(value => normalizeDay(value))
      .filter(Boolean)
  }

  const normalized = normalizeDay(row.day)
  return normalized ? [normalized] : []
}

function parseTimeWithMeridiem(value: string): number | null {
  const raw = String(value || '').trim()
  if (!raw) return null

  const twelveHourMatch = raw.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (twelveHourMatch) {
    let hour = Number(twelveHourMatch[1])
    const minute = Number(twelveHourMatch[2])
    const meridiem = String(twelveHourMatch[3]).toUpperCase()
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null
    if (meridiem === 'PM' && hour !== 12) hour += 12
    if (meridiem === 'AM' && hour === 12) hour = 0
    return hour * 60 + minute
  }

  const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!twentyFourHourMatch) return null

  const hour = Number(twentyFourHourMatch[1])
  const minute = Number(twentyFourHourMatch[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}

function minutesTo24Hour(minutes: number): string {
  const safeMinutes = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)))
  const hour = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function toTimeParts(value: string): TimeParts {
  const parsedMinutes = parseTimeWithMeridiem(value)
  const minutes = parsedMinutes === null ? 10 * 60 + 10 : parsedMinutes
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const meridiem: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM'
  let hour12 = hour24 % 12
  if (hour12 === 0) hour12 = 12

  return {
    hour12: String(hour12),
    minute: String(minute).padStart(2, '0'),
    meridiem,
  }
}

export function fromTimeParts(parts: TimeParts): string {
  const hour12 = Number(parts.hour12)
  const minute = Number(parts.minute)
  if (!Number.isFinite(hour12) || !Number.isFinite(minute)) return ''
  if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) return ''

  let hour24 = hour12 % 12
  if (parts.meridiem === 'PM') hour24 += 12
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function clampToSchoolDay(timeValue: string): string {
  const minutes = parseTimeWithMeridiem(timeValue)
  if (minutes === null) return '10:10'
  if (minutes < SCHOOL_DAY_START_MINUTES) return minutesTo24Hour(SCHOOL_DAY_START_MINUTES)
  if (minutes > SCHOOL_DAY_END_MINUTES) return minutesTo24Hour(SCHOOL_DAY_END_MINUTES)
  return minutesTo24Hour(minutes)
}

export function getDefaultServiceTypeForProvider(provider: string, providerMeta: Array<{ name?: string; specialty?: string; staffType?: string; service?: string }> = []): string {
  const normalizedProvider = String(provider || '').trim().toLowerCase()
  if (!normalizedProvider) return ''

  if (PROVIDER_SERVICE_DEFAULTS[normalizedProvider]) {
    return PROVIDER_SERVICE_DEFAULTS[normalizedProvider]
  }

  const matchedMeta = providerMeta.find(option => String(option?.name || '').trim().toLowerCase() === normalizedProvider)
  const specialty = String(matchedMeta?.specialty || matchedMeta?.staffType || matchedMeta?.service || '').toLowerCase()

  if (specialty.includes('bcba')) return 'BCBA'
  if (specialty.includes('bt')) return 'BT Support'

  return ''
}

export function buildAffectedPeriodOptions(student: { className?: string }, schedulePeriods: Array<{ id?: string | number; subject?: string }> = []): string[] {
  const values = new Set<string>()
  const classLabel = String(student?.className || '').trim()
  if (classLabel) {
    values.add(`Assigned Class: ${classLabel}`)
  }

  ;(Array.isArray(schedulePeriods) ? schedulePeriods : []).forEach(period => {
    const id = period?.id
    const subject = String(period?.subject || '').trim()
    if (subject && (typeof id === 'number' || String(id || '').trim())) {
      values.add(`Period ${String(id)}: ${subject}`)
      return
    }
    if (subject) values.add(subject)
  })

  ;[
    'Period 1',
    'Period 2',
    'Period 3',
    'English',
    'Reading',
    'Writing/Science',
    'Lunch',
    'Breakfast',
  ].forEach(option => values.add(option))

  return Array.from(values)
}

export function getAssignmentValidationIssues(assignment: AssignmentRow): string[] {
  if (!assignment.active) return []

  const issues: string[] = []
  const recurrence = String(assignment.recurrence || '').trim().toLowerCase()
  const hasDay = !!normalizeDay(assignment.day)
  const hasDate = !!String(assignment.date || '').trim()
  const customDays = assignmentDays(assignment)

  if (recurrence === 'weekly' && !hasDay) {
    issues.push('Weekly recurrence requires a day of week.')
  }

  if (recurrence === 'one-time' && !hasDate) {
    issues.push('One-time recurrence requires a specific date.')
  }

  if (recurrence === 'custom' && customDays.length === 0) {
    issues.push('Custom recurrence requires at least one selected weekday.')
  }

  const start = toMinutes(assignment.startTime)
  const end = toMinutes(assignment.endTime)
  if (start !== null && end !== null && end <= start) {
    issues.push('End time must be after start time.')
  }

  return issues
}

function toMinutes(value: string): number | null {
  return parseTimeWithMeridiem(value)
}

function overlaps(a: AssignmentRow, b: AssignmentRow): boolean {
  const aStart = toMinutes(a.startTime)
  const aEnd = toMinutes(a.endTime)
  const bStart = toMinutes(b.startTime)
  const bEnd = toMinutes(b.endTime)

  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false
  return aStart < bEnd && bStart < aEnd
}

function sameScheduleBucket(a: AssignmentRow, b: AssignmentRow): boolean {
  if (a.date && b.date) return a.date === b.date

  const aDays = assignmentDays(a)
  const bDays = assignmentDays(b)
  if (aDays.length === 0 || bDays.length === 0) return false

  return aDays.some(day => bDays.includes(day))
}

export function deriveStudentAssignments(student: any): AssignmentRow[] {
  if (Array.isArray(student?.therapyAssignments) && student.therapyAssignments.length > 0) {
    return student.therapyAssignments.map((row: any) => ({
      id: String(row.id || `therapy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      provider: String(row.provider || ''),
      serviceType: String(row.serviceType || ''),
      day: String(row.day || ''),
      date: String(row.date || ''),
      startTime: String(row.startTime || ''),
      endTime: String(row.endTime || ''),
      recurrence: String(row.recurrence || ''),
      affectedPeriod: String(row.affectedPeriod || ''),
      customDays: Array.isArray(row.customDays) ? row.customDays.map((value: unknown) => String(value || '')).filter(Boolean) : [],
      notes: String(row.notes || ''),
      active: row.active !== false,
    }))
  }

  const assignedTherapist = cleanText(student?.assignedTherapist)
  const therapyFrequency = cleanText(student?.therapyFrequency)
  const therapyNotes = cleanText(student?.therapyNotes)

  if (!assignedTherapist && !therapyFrequency && !therapyNotes) {
    return []
  }

  return [
    {
      id: `legacy-${String(student.id || 'student')}`,
      provider: assignedTherapist,
      serviceType: 'Therapy',
      day: '',
      date: '',
      startTime: '',
      endTime: '',
      recurrence: therapyFrequency,
      affectedPeriod: '',
      customDays: [],
      notes: therapyNotes,
      active: true,
    },
  ]
}

export function getAssignmentsByStudent(students: any[]): Record<string, AssignmentRow[]> {
  return (Array.isArray(students) ? students : []).reduce((acc: Record<string, AssignmentRow[]>, student: any) => {
    acc[String(student.id)] = deriveStudentAssignments(student)
    return acc
  }, {})
}

export function createEmptyAssignment(student: any): AssignmentRow {
  return {
    id: `therapy-${String(student?.id || 'student')}-${Date.now()}`,
    provider: '',
    serviceType: '',
    day: '',
    date: '',
    startTime: '10:10',
    endTime: '10:55',
    recurrence: 'Weekly',
    affectedPeriod: String(student?.className || ''),
    customDays: [],
    notes: '',
    active: true,
  }
}

export function toLegacyTherapyFields(assignments: AssignmentRow[]): {
  assignedTherapist: string
  therapyFrequency: string
  therapyNotes: string
} {
  const firstActive = assignments.find(row => row.active && row.provider)
  if (!firstActive) {
    return {
      assignedTherapist: '',
      therapyFrequency: '',
      therapyNotes: '',
    }
  }

  return {
    assignedTherapist: firstActive.provider,
    therapyFrequency: firstActive.recurrence || '',
    therapyNotes: firstActive.notes || '',
  }
}

export function buildAssignmentConflictIndex(entries: AssignmentWithStudent[]) {
  const studentWarningsByStudentId: Record<string, string[]> = {}
  const providerWarningsByAssignmentId: Record<string, string[]> = {}

  for (let i = 0; i < entries.length; i += 1) {
    const left = entries[i]
    if (!left.assignment.active) continue

    for (let j = i + 1; j < entries.length; j += 1) {
      const right = entries[j]
      if (!right.assignment.active) continue

      if (!sameScheduleBucket(left.assignment, right.assignment)) continue
      if (!overlaps(left.assignment, right.assignment)) continue

      if (String(left.studentId) === String(right.studentId)) {
        const warning = `${left.assignment.serviceType || 'Service'} overlaps ${right.assignment.serviceType || 'service'} (${left.assignment.startTime}-${left.assignment.endTime} and ${right.assignment.startTime}-${right.assignment.endTime}).`
        const key = String(left.studentId)
        studentWarningsByStudentId[key] = studentWarningsByStudentId[key] || []
        if (!studentWarningsByStudentId[key].includes(warning)) {
          studentWarningsByStudentId[key].push(warning)
        }
      }

      if (left.assignment.provider && left.assignment.provider === right.assignment.provider && String(left.studentId) !== String(right.studentId)) {
        const leftWarning = `${left.assignment.provider} overlaps with ${right.studentName} (${right.assignment.startTime}-${right.assignment.endTime}).`
        const rightWarning = `${right.assignment.provider} overlaps with ${left.studentName} (${left.assignment.startTime}-${left.assignment.endTime}).`

        providerWarningsByAssignmentId[left.assignment.id] = providerWarningsByAssignmentId[left.assignment.id] || []
        providerWarningsByAssignmentId[right.assignment.id] = providerWarningsByAssignmentId[right.assignment.id] || []

        if (!providerWarningsByAssignmentId[left.assignment.id].includes(leftWarning)) {
          providerWarningsByAssignmentId[left.assignment.id].push(leftWarning)
        }
        if (!providerWarningsByAssignmentId[right.assignment.id].includes(rightWarning)) {
          providerWarningsByAssignmentId[right.assignment.id].push(rightWarning)
        }
      }
    }
  }

  return {
    studentWarningsByStudentId,
    providerWarningsByAssignmentId,
  }
}
