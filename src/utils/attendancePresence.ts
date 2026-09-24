type StudentAttendanceLike = {
  dailyStatus?: string | null
  status?: string | null
  lateDetails?: { timeArrived?: string; markedAt?: string } | null
  departureDetails?: { timeDeparted?: string; markedAt?: string } | null
  classLog?: Array<{ type?: unknown; time?: unknown; recordedAt?: unknown; attendanceStatus?: unknown; arrivalTime?: unknown; departureTime?: unknown; note?: unknown }> | null
}

export type AttendanceHistoryRecord = {
  date: string
  status: string
  arrivalTime: string
  departureTime: string
  leftEarly: boolean
}

export function getAttendanceCode(record: Pick<AttendanceHistoryRecord, 'status' | 'leftEarly'> | undefined): string {
  if (!record) return ''
  const code = ATTENDANCE_CODES[record.status] || ''
  return record.leftEarly && code !== 'LE' ? `${code}/LE` : code
}

export function getAttendanceDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return []
  const dates: string[] = []
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(getAttendanceDateKey(date))
  }
  return dates
}

export function getAttendanceWeekRange(reference = new Date(), dayCount = 6) {
  const start = new Date(reference)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + dayCount - 1)
  return { startDate: getAttendanceDateKey(start), endDate: getAttendanceDateKey(end) }
}

export function getActiveAttendanceStudents<T extends { is_active?: boolean; [key: string]: any }>(students: T[]): T[] {
  return students.filter(student => student?.is_active !== false)
}

export function buildClassroomAttendanceScopeOptions(
  classes: Array<{ id: string; name: string; teacher?: string }> = [],
  groups: Array<{ id: string; name: string; teacher_name?: string; status?: string; is_active?: boolean }> = [],
  teacherFilter = '',
) {
  return [
    ...classes.map(scope => ({ id: scope.id, name: scope.name, teacher: scope.teacher || '', kind: 'class' as const })),
    ...groups
      .filter(scope => scope.status !== 'archived' && scope.is_active !== false)
      .map(scope => ({ id: scope.id, name: scope.name, teacher: scope.teacher_name || '', kind: 'group' as const })),
  ].filter(scope => !teacherFilter || scope.teacher === teacherFilter)
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

export function getAttendanceDateKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function hasDailyAttendanceRecordForDate(student: StudentAttendanceLike, date: Date = new Date()): boolean {
  const targetDate = getAttendanceDateKey(date)
  const classLog = Array.isArray(student?.classLog) ? student.classLog : []

  return classLog.some(entry => {
    const recordedAt = String(entry?.recordedAt || '')
    if (!recordedAt) return false

    const recordedDate = new Date(recordedAt)
    if (Number.isNaN(recordedDate.getTime())) return false

    return getAttendanceDateKey(recordedDate) === targetDate && DAILY_ATTENDANCE_LOG_TYPES.has(String(entry?.type || ''))
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
  if (student?.departureDetails || getDailyAttendanceStatus(student) === 'left-early') return 'left-early'
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

export function getAttendanceHistory(
  student: StudentAttendanceLike,
  range: { startDate?: string; endDate?: string } = {},
): AttendanceHistoryRecord[] {
  const recordsByDate = new Map<string, {
    status: string
    statusRecordedAt: number
    arrivalTime: string
    arrivalRecordedAt: number
    departureTime: string
    departureRecordedAt: number
    leftEarly: boolean
  }>()

  for (const entry of Array.isArray(student?.classLog) ? student.classLog : []) {
    const recordedDate = new Date(String(entry?.recordedAt || ''))
    if (Number.isNaN(recordedDate.getTime())) continue
    const date = getAttendanceDateKey(recordedDate)
    const recordedAt = recordedDate.getTime()
    const current = recordsByDate.get(date) || {
      status: '',
      statusRecordedAt: 0,
      arrivalTime: '',
      arrivalRecordedAt: 0,
      departureTime: '',
      departureRecordedAt: 0,
      leftEarly: false,
    }
    const type = String(entry?.type || '')

    if (type === 'attendance-update') {
      const status = getAttendanceStatusFromLogEntry(entry)
      if (ATTENDANCE_CODES[status] && recordedAt >= current.statusRecordedAt) {
        current.status = status
        current.statusRecordedAt = recordedAt
      }
      if (status === 'late' && recordedAt >= current.arrivalRecordedAt) {
        current.arrivalTime = String(entry?.arrivalTime || entry?.time || '')
        current.arrivalRecordedAt = recordedAt
      }
      if (status === 'left-early' && recordedAt >= current.departureRecordedAt) {
        current.leftEarly = true
        current.departureTime = String(entry?.departureTime || entry?.time || '')
        current.departureRecordedAt = recordedAt
      }
    } else if (type === 'late-details' && recordedAt >= current.arrivalRecordedAt) {
      current.arrivalTime = String(entry?.arrivalTime || entry?.time || '')
      current.arrivalRecordedAt = recordedAt
    } else if ((type === 'departure-details' || type === 'departure-cleared') && recordedAt >= current.departureRecordedAt) {
      current.leftEarly = type === 'departure-details'
      current.departureTime = type === 'departure-details' ? String(entry?.departureTime || entry?.time || '') : ''
      current.departureRecordedAt = recordedAt
    }

    recordsByDate.set(date, current)
  }

  const applyCurrentDetails = (markedAt: string | undefined, apply: (record: NonNullable<ReturnType<typeof recordsByDate.get>>) => void) => {
    if (!markedAt) return
    const markedDate = new Date(markedAt)
    if (Number.isNaN(markedDate.getTime())) return
    const record = recordsByDate.get(getAttendanceDateKey(markedDate))
    if (record) apply(record)
  }
  applyCurrentDetails(student.lateDetails?.markedAt, record => {
    if (record.status === 'late') record.arrivalTime = String(student.lateDetails?.timeArrived || record.arrivalTime)
  })
  applyCurrentDetails(student.departureDetails?.markedAt, record => {
    record.leftEarly = true
    record.departureTime = String(student.departureDetails?.timeDeparted || record.departureTime)
  })

  return Array.from(recordsByDate.entries())
    .filter(([date, record]) => record.status && (!range.startDate || date >= range.startDate) && (!range.endDate || date <= range.endDate))
    .map(([date, record]) => ({
      date,
      status: record.status,
      arrivalTime: record.status === 'late' ? record.arrivalTime : '',
      departureTime: record.leftEarly ? record.departureTime : '',
      leftEarly: record.leftEarly || record.status === 'left-early',
    }))
    .sort((left, right) => right.date.localeCompare(left.date))
}

export function getWeeklyAttendanceCodes(
  student: StudentAttendanceLike,
  date: Date = new Date(),
  dayCount = 6,
): string[] {
  const weekStart = new Date(date)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + dayCount - 1)
  const recordsByDate = new Map(getAttendanceHistory(student, {
    startDate: getAttendanceDateKey(weekStart),
    endDate: getAttendanceDateKey(weekEnd),
  }).map(record => [record.date, record]))

  return Array.from({ length: dayCount }, (_, offset) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + offset)
    const record = recordsByDate.get(getAttendanceDateKey(day))
    if (!record) return ''
    return getAttendanceCode(record)
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
