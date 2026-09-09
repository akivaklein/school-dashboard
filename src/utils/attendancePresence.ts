type StudentAttendanceLike = {
  dailyStatus?: string | null
  status?: string | null
  classLog?: Array<{ type?: unknown; recordedAt?: unknown; attendanceStatus?: unknown; note?: unknown }> | null
}

const ARRIVAL_DAILY_STATUSES = new Set(['present', 'late', 'left-early'])
const ON_CAMPUS_STATUSES = new Set(['present', 'late', 'therapy', 'with-bt'])
const DAILY_ATTENDANCE_LOG_TYPES = new Set(['attendance-update', 'late-details', 'departure-details', 'day-reset'])

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

function getDateKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function hasDailyAttendanceRecordForDate(student: StudentAttendanceLike, date: Date = new Date()): boolean {
  const targetDate = getDateKey(date)
  const classLog = Array.isArray(student?.classLog) ? student.classLog : []

  return classLog.some(entry => {
    const recordedAt = String(entry?.recordedAt || '')
    if (!recordedAt) return false

    const recordedDate = new Date(recordedAt)
    if (Number.isNaN(recordedDate.getTime())) return false

    return getDateKey(recordedDate) === targetDate && DAILY_ATTENDANCE_LOG_TYPES.has(String(entry?.type || ''))
  })
}

export function resolveDailyAttendanceStatusForDate(student: StudentAttendanceLike, date: Date = new Date()): string {
  const dailyStatus = getDailyAttendanceStatus(student)
  if (dailyStatus === 'not-arrived' || dailyStatus === 'unconfirmed') return dailyStatus
  return hasDailyAttendanceRecordForDate(student, date) ? dailyStatus : 'not-arrived'
}

export function resolveRealtimeDailyAttendanceStatus(
  dailyStatus: string | null | undefined,
  rowClassLog: StudentAttendanceLike['classLog'],
  fallbackClassLog: StudentAttendanceLike['classLog'],
  date: Date = new Date(),
): string {
  return resolveDailyAttendanceStatusForDate({
    dailyStatus,
    classLog: Array.isArray(rowClassLog) ? rowClassLog : fallbackClassLog,
  }, date)
}

export function hasConfirmedArrival(student: StudentAttendanceLike): boolean {
  return ARRIVAL_DAILY_STATUSES.has(getDailyAttendanceStatus(student))
}

export function isCurrentlyOnCampus(student: StudentAttendanceLike): boolean {
  return ON_CAMPUS_STATUSES.has(getCurrentLocationStatus(student))
}

export function getCurrentLocationStatus(student: StudentAttendanceLike): string {
  if (!hasConfirmedArrival(student)) return 'not-confirmed'
  if (getDailyAttendanceStatus(student) === 'left-early') return 'left-early'
  const locationStatus = normalizeStatus(student?.status)
  if (locationStatus === 'late' || locationStatus === 'not-arrived') return 'present'
  return locationStatus || 'unknown'
}

export function getStudentStatusDisplay(student: StudentAttendanceLike): { dailyStatus: string; locationStatus: string } {
  return {
    dailyStatus: getDailyAttendanceStatus(student),
    locationStatus: getCurrentLocationStatus(student),
  }
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
  return getCurrentLocationStatus(student) === 'present' && isInSchool(student)
}

const ATTENDANCE_CODES: Record<string, string> = {
  present: 'P',
  absent: 'A',
  late: 'L',
  'left-early': 'LE',
  'not-arrived': 'NA',
}

function getAttendanceStatusFromLogEntry(entry: NonNullable<StudentAttendanceLike['classLog']>[number]): string {
  const explicitStatus = normalizeStatus(String(entry?.attendanceStatus || ''))
  if (ATTENDANCE_CODES[explicitStatus]) return explicitStatus

  const match = String(entry?.note || '').match(/attendance marked\s+(present|absent|late|left-early|not-arrived)\b/i)
  return normalizeStatus(match?.[1])
}

export function getWeeklyAttendanceCodes(
  student: StudentAttendanceLike,
  date: Date = new Date(),
  dayCount = 6,
): string[] {
  const weekStart = new Date(date)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const statusesByDate = new Map<string, { recordedAt: number; code: string }>()

  for (const entry of Array.isArray(student?.classLog) ? student.classLog : []) {
    if (String(entry?.type || '') !== 'attendance-update') continue
    const status = getAttendanceStatusFromLogEntry(entry)
    const code = ATTENDANCE_CODES[status]
    const recordedDate = new Date(String(entry?.recordedAt || ''))
    if (!code || Number.isNaN(recordedDate.getTime())) continue

    const dateKey = getDateKey(recordedDate)
    const previous = statusesByDate.get(dateKey)
    if (!previous || recordedDate.getTime() >= previous.recordedAt) {
      statusesByDate.set(dateKey, { recordedAt: recordedDate.getTime(), code })
    }
  }

  return Array.from({ length: dayCount }, (_, offset) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + offset)
    return statusesByDate.get(getDateKey(day))?.code || ''
  })
}

export function isLocationUnknown(student: StudentAttendanceLike): boolean {
  return student?.status === 'unknown' || student?.status === 'not-arrived'
}

export function resolveClassroomStatusAfterAttendanceUpdate(
  currentStatus: string | null | undefined,
  nextDailyStatus: string,
): string {
  void nextDailyStatus
  return String(currentStatus || 'unknown')
}
