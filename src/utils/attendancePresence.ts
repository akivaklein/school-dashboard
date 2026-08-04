type StudentAttendanceLike = {
  dailyStatus?: string | null
  status?: string | null
}

const ARRIVAL_DAILY_STATUSES = new Set(['present', 'late', 'left-early'])
const ON_CAMPUS_STATUSES = new Set(['present', 'late', 'therapy', 'with-bt'])

function normalizeStatus(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase()
}

export function getDailyAttendanceStatus(student: StudentAttendanceLike): string {
  const value = normalizeStatus(student?.dailyStatus)
  if (!value) return 'unconfirmed'
  if (ARRIVAL_DAILY_STATUSES.has(value)) return value
  if (value === 'not-arrived' || value === 'absent' || value === 'unknown') return value
  return 'unconfirmed'
}

export function hasConfirmedArrival(student: StudentAttendanceLike): boolean {
  return ARRIVAL_DAILY_STATUSES.has(getDailyAttendanceStatus(student))
}

export function isCurrentlyOnCampus(student: StudentAttendanceLike): boolean {
  return ON_CAMPUS_STATUSES.has(normalizeStatus(student?.status))
}

export function isOutOfSchool(student: StudentAttendanceLike): boolean {
  return !isInSchool(student)
}

export function isInSchool(student: StudentAttendanceLike): boolean {
  return hasConfirmedArrival(student) && isCurrentlyOnCampus(student)
}

export function cameToSchoolToday(student: StudentAttendanceLike): boolean {
  return hasConfirmedArrival(student)
}

export function isInClassroom(student: StudentAttendanceLike): boolean {
  return normalizeStatus(student?.status) === 'present' && isInSchool(student)
}

export function isLocationUnknown(student: StudentAttendanceLike): boolean {
  return student?.status === 'unknown' || student?.status === 'not-arrived'
}

export function resolveClassroomStatusAfterAttendanceUpdate(
  currentStatus: string | null | undefined,
  nextDailyStatus: string,
): string {
  if (nextDailyStatus === 'absent') return 'not-arrived'
  if (nextDailyStatus === 'left-early') return 'left-early'

  if (nextDailyStatus === 'present') return 'present'

  if (currentStatus === 'not-arrived' || currentStatus === 'left-early' || currentStatus === 'absent') {
    return 'present'
  }

  return String(currentStatus || 'present')
}
