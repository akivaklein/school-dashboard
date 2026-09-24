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
    ], new Date())

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

  it('uses real older attendance records and leaves unrecorded days unconfirmed', () => {
    const [row] = buildAttendanceReportRows([{
      id: 1,
      name: 'Sample Student',
      dailyStatus: 'not-arrived',
      classLog: [
        { type: 'attendance-update', attendanceStatus: 'absent', recordedAt: '2026-09-20T08:00:00' },
        { type: 'attendance-update', attendanceStatus: 'late', arrivalTime: '09:11', recordedAt: '2026-09-22T09:11:00' },
        { type: 'departure-details', departureTime: '13:35', recordedAt: '2026-09-22T13:35:00' },
      ],
    }], new Date('2026-09-24T12:00:00'))

    expect(row.history.find(day => day.date === '2026-09-22')).toMatchObject({ status: 'late', arrived: '09:11', left: '13:35', leftEarly: true })
    expect(row.history.find(day => day.date === '2026-09-20')).toMatchObject({ status: 'absent' })
    expect(row.history[0]).toMatchObject({ date: '2026-09-24', status: 'unconfirmed' })
  })
})