import { describe, expect, it } from 'vitest'
import { resolveActorName } from '../dashboardData'

describe('resolveActorName', () => {
  it('prefers the logged-in staff name when provided', () => {
    expect(resolveActorName('Miriam', 'teacher')).toBe('Miriam')
  })

  it('falls back to a role-based label when the actor is missing', () => {
    expect(resolveActorName('', 'teacher')).toBe('Teacher')
    expect(resolveActorName('', 'therapist')).toBe('Therapist')
    expect(resolveActorName('', 'admin')).toBe('Staff')
  })
})
