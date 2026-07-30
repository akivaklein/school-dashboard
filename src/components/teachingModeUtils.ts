export function buildLateToClassFields(student: Record<string, any>, options: { timeStr: string; actingStaffName: string; note: string; staffId?: number | string | null }) {
  const classLogEntry = {
    time: options.timeStr,
    type: 'in',
    note: `${options.note} (recorded by ${options.actingStaffName})`,
    staffId: options.staffId || null,
    staffName: options.actingStaffName,
    recordedAt: new Date().toISOString(),
  }

  const wasNotInSchool =
    student.dailyStatus === 'absent' ||
    student.status === 'absent' ||
    student.status === 'not-arrived'

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
        }
      : student.lateDetails || null,
    classLog: [...(student.classLog || []), classLogEntry],
  }
}
