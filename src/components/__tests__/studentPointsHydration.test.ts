import { describe, expect, it } from 'vitest'
import { resolveLiveStudentPoints } from '../dashboardData'

describe('resolveLiveStudentPoints', () => {
  it('treats a live student with null token_balance as 0 instead of preserving demo points', () => {
    expect(resolveLiveStudentPoints(null)).toBe(0)
    expect(resolveLiveStudentPoints(undefined)).toBe(0)
    expect(resolveLiveStudentPoints(24)).toBe(24)
  })
})
