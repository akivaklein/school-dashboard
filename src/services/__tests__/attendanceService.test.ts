import { describe, expect, it } from 'vitest'
import { applyDailyAttendanceReset } from '../attendanceService'

describe('applyDailyAttendanceReset', () => {
  it('resets attendance-related fields and records a reset entry', () => {
    const students = [
      {
        id: 1,
        name: 'Avi',
        dailyStatus: 'present',
        status: 'present',
        withStaff: 'Ms. Cohen',
        lateDetails: { reason: 'Traffic' },
        classLog: [{ note: 'Earlier' }],
      },
    ]

    const reset = applyDailyAttendanceReset(students, '2026-07-27', new Date('2026-07-27T10:00:00Z'))

    expect(reset[0].dailyStatus).toBe('not-arrived')
    expect(reset[0].status).toBe('not-arrived')
    expect(reset[0].withStaff).toBeNull()
    expect(reset[0].lateDetails).toBeNull()
    expect(reset[0].classLog.at(-1)).toMatchObject({
      type: 'day-reset',
      note: 'Daily attendance reset for 2026-07-27',
      staffName: 'System',
    })
  })
})
