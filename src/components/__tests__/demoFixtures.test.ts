import { describe, expect, it } from 'vitest'
import { DEMO_STORE_ACTIVITY, DEMO_STUDENT_FLAGS, HISTORICAL_DATA, THERAPY_SCHEDULE } from '../dashboardData'

describe('demo fixture realism', () => {
  it('contains rich fallback store activity records', () => {
    expect(DEMO_STORE_ACTIVITY.length).toBeGreaterThanOrEqual(5)
    expect(DEMO_STORE_ACTIVITY.some(entry => entry.division === 'mesivta')).toBe(true)
    expect(DEMO_STORE_ACTIVITY.some(entry => entry.division === 'yeshiva_ketana')).toBe(true)
  })

  it('contains multiple active student flags for demo workflows', () => {
    expect(DEMO_STUDENT_FLAGS.length).toBeGreaterThanOrEqual(4)
    expect(DEMO_STUDENT_FLAGS.some(flag => Array.isArray(flag.observations) && flag.observations.length > 0)).toBe(true)
  })

  it('keeps Avrohom tracking history rich while allowing Yair empty-state', () => {
    expect(Array.isArray((HISTORICAL_DATA as Record<string, unknown>)['6'])).toBe(true)
    expect((HISTORICAL_DATA as Record<string, unknown>)['1']).toBeUndefined()
  })

  it('includes an active therapy schedule across several students', () => {
    expect(THERAPY_SCHEDULE.length).toBeGreaterThanOrEqual(8)
    expect(THERAPY_SCHEDULE.some(item => item.student === 'Levitz Avrohom')).toBe(true)
  })
})
