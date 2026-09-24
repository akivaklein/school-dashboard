import { getDailyAttendanceStatus, isInSchool } from '../utils/attendancePresence'
import { resolveStudentClassIds, studentBelongsToClass } from './dashboardData'

type TeachingStudent = { id: number | string; classLog?: Array<Record<string, any>>; [key: string]: any }
type TeachingClass = { id: string; grade?: string }

function uniqueActiveStudents(students: TeachingStudent[]) {
  const seen = new Set<number>()
  return (students || []).filter(student => {
    const studentId = Number(student.id)
    if (!Number.isFinite(studentId) || student.is_active === false || seen.has(studentId)) return false
    seen.add(studentId)
    return true
  })
}

export function getTeachingClassRoster({ schoolStudents, authorizedStudents, selectedClass, additionalClassIdsByStudent = {} }: {
  schoolStudents: TeachingStudent[]
  authorizedStudents: TeachingStudent[]
  selectedClass: string
  additionalClassIdsByStudent?: Record<string | number, string[]>
}) {
  const authorized = uniqueActiveStudents(authorizedStudents)
  if (!selectedClass || !authorized.some(student => studentBelongsToClass(student, selectedClass, additionalClassIdsByStudent))) return []
  return uniqueActiveStudents(schoolStudents).filter(student => studentBelongsToClass(student, selectedClass, additionalClassIdsByStudent))
}

export function getTeachingGradeRoster({ schoolStudents, authorizedStudents, selectedGrade, classes, additionalClassIdsByStudent = {} }: {
  schoolStudents: TeachingStudent[]
  authorizedStudents: TeachingStudent[]
  selectedGrade: string
  classes: TeachingClass[]
  additionalClassIdsByStudent?: Record<string | number, string[]>
}) {
  const classIdsForGrade = new Set(classes.filter(classEntry => classEntry.grade === selectedGrade).map(classEntry => classEntry.id))
  if (classIdsForGrade.size === 0) return []
  const isInGrade = (student: TeachingStudent) => resolveStudentClassIds(student, additionalClassIdsByStudent).some(classId => classIdsForGrade.has(classId))
  if (!uniqueActiveStudents(authorizedStudents).some(isInGrade)) return []
  return uniqueActiveStudents(schoolStudents).filter(isInGrade)
}

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function buildClassroomSessionKey({ date = new Date(), scopeType, scopeValue, periodId }: { date?: Date; scopeType?: string; scopeValue?: string; periodId?: string | number | null }) {
  // Physical classroom presence is a single fact per student/date/period. It must NOT be
  // fragmented by which roster/scope filter (Entire School, a class, a group, ...) a
  // teacher happens to be viewing at the moment — that would let the same student read as
  // simultaneously "in class" under one scope and "not in class" under another.
  // scopeType/scopeValue are accepted for call-site convenience but intentionally excluded
  // from the key.
  void scopeType
  void scopeValue
  return [localDateKey(date), String(periodId || 'manual')].join(':')
}

// Canonical id -> student lookup so every scope reads the exact same, current attendance
// object for a given student instead of whatever (possibly stale) copy a particular
// scope/roster filter happened to carry.
export function buildStudentLookup(students: TeachingStudent[]): Map<number, TeachingStudent> {
  const lookup = new Map<number, TeachingStudent>()
  ;(students || []).forEach(student => {
    const id = Number(student?.id)
    if (Number.isFinite(id)) lookup.set(id, student)
  })
  return lookup
}

export function resolveCanonicalStudent<T extends TeachingStudent>(lookup: Map<number, T>, student: T): T {
  return lookup.get(Number(student?.id)) ?? student
}

export function getClassroomAttendanceStatus(student: TeachingStudent, sessionKey: string): 'present' | 'unmarked' {
  // A student who is currently not-arrived/absent/left-early can never resolve as "in class",
  // even if an earlier classroom-attendance record for this session says otherwise.
  if (!isInSchool(student)) return 'unmarked'
  const record = [...(student.classLog || [])].reverse().find(entry => (
    entry?.type === 'classroom-attendance' && entry?.classroomSessionKey === sessionKey
  ))
  return record?.classroomStatus === 'present' ? 'present' : 'unmarked'
}

export function buildClassroomAttendanceFields(student: TeachingStudent, options: { sessionKey: string; status: 'present' | 'unmarked'; actingStaffName: string; recordedAt?: string }) {
  const recordedAt = options.recordedAt || new Date().toISOString()
  return {
    classLog: [
      ...(student.classLog || []),
      {
        time: new Date(recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        type: 'classroom-attendance',
        classroomSessionKey: options.sessionKey,
        classroomStatus: options.status,
        note: `Classroom attendance marked ${options.status} by ${options.actingStaffName}`,
        staffId: null,
        staffName: options.actingStaffName,
        recordedAt,
      },
    ],
  }
}

export function didTeachingModeWriteSucceed(result: unknown): boolean {
  return result !== false
}

export function summarizeTeachingModeWriteResults(results: unknown[]): { total: number; failedCount: number; allSucceeded: boolean } {
  const total = results.length
  const failedCount = results.filter(result => !didTeachingModeWriteSucceed(result)).length
  return {
    total,
    failedCount,
    allSucceeded: failedCount === 0,
  }
}

export function buildTeachingModeWriteFailureMessage(summary: { total: number; failedCount: number }): string {
  if (summary.failedCount <= 0) return ''
  const savedCount = Math.max(0, summary.total - summary.failedCount)
  return `Saved ${savedCount} of ${summary.total}. ${summary.failedCount} action${summary.failedCount === 1 ? '' : 's'} failed to persist.`
}

export function deduplicateStudentIds(values: Array<number | string | null | undefined>): number[] {
  const seen = new Set<number>()
  const result: number[] = []

  values.forEach(value => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return
    if (seen.has(numeric)) return
    seen.add(numeric)
    result.push(numeric)
  })

  return result
}

export function buildLateToClassFields(student: Record<string, any>, options: { timeStr: string; actingStaffName: string; note: string; staffId?: number | string | null; approval?: 'approved' | 'unapproved'; lateMinutes?: number | null }) {
  const returnApproval = options.approval || 'approved'
  const lateMinutes = Number.isFinite(Number(options.lateMinutes))
    ? Math.max(0, Number(options.lateMinutes))
    : null

  const lateTimingLabel = lateMinutes === null
    ? 'late minutes not recorded'
    : `${lateMinutes} minute${lateMinutes === 1 ? '' : 's'} late`

  const classLogEntry = {
    time: options.timeStr,
    type: 'in',
    note: `${options.note} (${returnApproval} return, ${lateTimingLabel}; recorded by ${options.actingStaffName})`,
    staffId: options.staffId || null,
    staffName: options.actingStaffName,
    recordedAt: new Date().toISOString(),
  }

  const wasNotInSchool = !isInSchool(student)

  const classReturn = {
    approval: returnApproval,
    lateMinutes,
    note: options.note,
    staffId: options.staffId || null,
    markedBy: options.actingStaffName,
    markedAt: new Date().toISOString(),
  }

  return {
    status: 'present',
    dailyStatus: wasNotInSchool ? 'late' : getDailyAttendanceStatus(student),
    withStaff: null,
    lateDetails: wasNotInSchool
      ? {
          timeArrived: options.timeStr,
          reason: 'late-to-class',
          note: options.note,
          markedBy: options.actingStaffName,
          markedAt: new Date().toISOString(),
          classReturn,
        }
      : {
          ...(student.lateDetails || {}),
          classReturn,
        },
    classLog: [...(student.classLog || []), classLogEntry],
  }
}
