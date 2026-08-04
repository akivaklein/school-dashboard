import { getDailyAttendanceStatus, isInSchool } from '../utils/attendancePresence'

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
