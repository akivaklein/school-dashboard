import { describe, expect, it } from 'vitest'
import { getDashboardContextInfo } from '../dashboardData'

describe('getDashboardContextInfo', () => {
  it('returns a user-friendly summary for the active dashboard context', () => {
    expect(getDashboardContextInfo('attendance', 'teacher', 'mesivta')).toEqual({
      roleLabel: 'Teacher',
      pageLabel: 'Attendance',
      divisionLabel: 'Yeshiva Ketana',
      contextSummary: 'Attendance · Teacher · Yeshiva Ketana',
    })
  })
})
