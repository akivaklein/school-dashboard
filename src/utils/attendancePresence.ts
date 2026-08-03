type StudentAttendanceLike = {
  dailyStatus?: string | null
  status?: string | null
}

const OUT_OF_SCHOOL_DAILY_STATUSES = new Set(['absent', 'left-early'])

export function getDailyAttendanceStatus(student: StudentAttendanceLike): string {
  return String(student?.dailyStatus || 'present')
}

export function isOutOfSchool(student: StudentAttendanceLike): boolean {
  return OUT_OF_SCHOOL_DAILY_STATUSES.has(getDailyAttendanceStatus(student))
}

export function isInSchool(student: StudentAttendanceLike): boolean {
  return !isOutOfSchool(student)
}

export function cameToSchoolToday(student: StudentAttendanceLike): boolean {
  return getDailyAttendanceStatus(student) !== 'absent'
}

export function isInClassroom(student: StudentAttendanceLike): boolean {
  return student?.status === 'present' && isInSchool(student)
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
