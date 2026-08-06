import { describe, expect, it } from 'vitest'
import { buildReportsOverview } from '../reportsUtils'

describe('buildReportsOverview', () => {
  it('summarizes attendance data for the reports page', () => {
    const overview = buildReportsOverview({
      attendanceRows: [
        { name: 'Ari', lastStatus: 'present' },
        { name: 'Ben', lastStatus: 'absent' },
        { name: 'Chaim', lastStatus: 'late' },
        { name: 'Dovi', lastStatus: 'left-early' },
      ],
    })

    expect(overview.attendanceSummary).toEqual({
      present: 1,
      absent: 1,
      late: 1,
      leftEarly: 1,
      total: 4,
    })

    expect(overview).not.toHaveProperty('admissionsSummary')
  })
})
