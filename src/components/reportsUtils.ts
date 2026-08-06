export function buildReportsOverview({ attendanceRows }) {
  const attendanceSummary = attendanceRows.reduce(
    (summary, row) => {
      const status = row?.lastStatus
      if (status === 'absent') summary.absent += 1
      else if (status === 'late') summary.late += 1
      else if (status === 'left-early') summary.leftEarly += 1
      else summary.present += 1
      return summary
    },
    { present: 0, absent: 0, late: 0, leftEarly: 0, total: 0 },
  )

  attendanceSummary.total = attendanceRows.length

  return {
    attendanceSummary,
  }
}
