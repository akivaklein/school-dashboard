export function applyDailyAttendanceReset(studentsList: Array<Record<string, any>>, resetDate: string, now: Date = new Date()) {
  return studentsList.map(student => {
    const resetLogEntry = {
      time: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      type: 'day-reset',
      note: `Daily attendance reset for ${resetDate}`,
      staffId: null,
      staffName: 'System',
      recordedAt: now.toISOString(),
    }

    return {
      ...student,
      dailyStatus: 'not-arrived',
      status: 'not-arrived',
      withStaff: null,
      lateDetails: null,
      classLog: [...(student.classLog || []), resetLogEntry],
    }
  })
}
