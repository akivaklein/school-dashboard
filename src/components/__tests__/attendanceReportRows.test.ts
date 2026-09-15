import { describe, expect, it } from 'vitest'
import { buildAttendanceReportRows } from '../dashboardData'

describe('buildAttendanceReportRows', () => {
  it('shows a late arrival and early departure on the same current-day record', () => {
    const [row] = buildAttendanceReportRows([
      {
        id: 1,
        name: 'Sample Student',
        dailyStatus: 'late',
        lateDetails: { timeArrived: '09:20' },
        departureDetails: { timeDeparted: '14:05' },
      },
    ])

    expect(row.history[0]).toMatchObject({
      status: 'late',
      arrived: '09:20',
      left: '14:05',
      leftEarly: true,
    })
    expect(row.lastStatus).toBe('late')
    expect(row.lastLeftEarly).toBe(true)
    expect(row.lateDays).toBeGreaterThan(0)
    expect(row.leftEarlyDays).toBeGreaterThan(0)
  })
})