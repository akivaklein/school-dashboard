type AssignmentRow = {
  id: string
  provider: string
  serviceType: string
  day: string
  date: string
  startTime: string
  endTime: string
  recurrence: string
  affectedPeriod: string
  notes: string
  active: boolean
}

type AssignmentWithStudent = {
  studentId: string | number
  studentName: string
  assignment: AssignmentRow
}

function toMinutes(value: string): number | null {
  if (!value) return null
  const parts = String(value).split(':')
  if (parts.length < 2) return null
  const hour = Number(parts[0])
  const minute = Number(parts[1])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
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
  if (a.day && b.day) return a.day === b.day
  return false
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
      notes: String(row.notes || ''),
      active: row.active !== false,
    }))
  }

  if (!student?.assignedTherapist && !student?.therapyFrequency && !student?.therapyNotes) {
    return []
  }

  return [
    {
      id: `legacy-${String(student.id || 'student')}`,
      provider: String(student.assignedTherapist || ''),
      serviceType: 'Therapy',
      day: '',
      date: '',
      startTime: '',
      endTime: '',
      recurrence: String(student.therapyFrequency || ''),
      affectedPeriod: '',
      notes: String(student.therapyNotes || ''),
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
    startTime: '',
    endTime: '',
    recurrence: 'Weekly',
    affectedPeriod: String(student?.className || ''),
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
