export function buildReportsOverview({ attendanceRows, intakeList }) {
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

  const admissionsSummary = intakeList.reduce(
    (summary, applicant) => {
      const decision = applicant?.decision || 'No decision yet'
      if (decision === 'Accepted' || decision === 'Accepted with supports') summary.accepted += 1
      else if (decision === 'Needs more information') summary.needsInfo += 1
      return summary
    },
    { accepted: 0, needsInfo: 0, total: 0 },
  )

  admissionsSummary.total = intakeList.length

  return {
    attendanceSummary,
    admissionsSummary,
  }
}
