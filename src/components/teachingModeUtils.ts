import { isInSchool } from '../utils/attendancePresence'

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
    dailyStatus: wasNotInSchool ? 'late' : student.dailyStatus || 'present',
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
