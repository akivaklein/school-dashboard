import { describe, expect, it } from 'vitest'
import { DEMO_STORE_ACTIVITY, DEMO_STUDENT_FLAGS, HISTORICAL_DATA, THERAPY_SCHEDULE } from '../dashboardData'

describe('secure fixture guardrails', () => {
  it('keeps runtime store demo fallback disabled', () => {
    expect(DEMO_STORE_ACTIVITY).toEqual([])
  })

  it('keeps runtime student-flag demo fallback disabled', () => {
    expect(DEMO_STUDENT_FLAGS).toEqual([])
  })

  it('retains historical dataset structure for tooling/tests only', () => {
    expect(Array.isArray((HISTORICAL_DATA as Record<string, unknown>)['6'])).toBe(true)
    expect(HISTORICAL_DATA).toBeTypeOf('object')
  })

  it('includes an active therapy schedule across several students', () => {
    expect(THERAPY_SCHEDULE.length).toBeGreaterThanOrEqual(8)
    expect(THERAPY_SCHEDULE.some(item => item.student === 'Levitz Avrohom')).toBe(true)
  })
})
