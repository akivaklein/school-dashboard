import { describe, expect, it } from 'vitest'
import {
  CONFLICTING_ROLES_MESSAGE,
  NO_ACTIVE_ROLE_MESSAGE,
  NO_PROFILE_MESSAGE,
  resolveDashboardAccess,
} from '../dashboardAccess'

describe('resolveDashboardAccess', () => {
  it('grants access for a normal admin profile', () => {
    const result = resolveDashboardAccess([{ role: 'admin', display_name: 'Rabbi Klein', is_active: true }])

    expect(result).toEqual({ status: 'granted', user: { role: 'admin', name: 'Rabbi Klein' } })
  })

  it('falls back to a default display name when none is stored', () => {
    const result = resolveDashboardAccess([{ role: 'ADMIN ', display_name: null, is_active: null }])

    expect(result).toEqual({ status: 'granted', user: { role: 'admin', name: 'Rabbi Klein' } })
  })

  it('grants restricted register access with a register display name', () => {
    expect(resolveDashboardAccess([{ role: 'register', display_name: null, is_active: true }]))
      .toEqual({ status: 'granted', user: { role: 'register', name: 'Store Register' } })
  })

  it('returns a clear message when zero profiles match', () => {
    expect(resolveDashboardAccess([])).toEqual({ status: 'denied', message: NO_PROFILE_MESSAGE })
    expect(resolveDashboardAccess(null)).toEqual({ status: 'denied', message: NO_PROFILE_MESSAGE })
  })

  it('accepts leadership roles with school-wide access', () => {
    expect(resolveDashboardAccess([{ role: 'admin', display_name: 'X', is_active: false }]))
      .toEqual({ status: 'denied', message: NO_ACTIVE_ROLE_MESSAGE })
    expect(resolveDashboardAccess([{ role: 'principal', display_name: 'Principal', is_active: true }]))
      .toEqual({ status: 'granted', user: { role: 'principal', name: 'Principal' } })
  })

  it('does not escalate privileges when duplicate conflicting rows exist', () => {
    const result = resolveDashboardAccess([
      { role: 'teacher', display_name: 'Dup', is_active: true },
      { role: 'admin', display_name: 'Dup', is_active: true },
    ])

    expect(result).toEqual({ status: 'denied', message: CONFLICTING_ROLES_MESSAGE })
  })

  it('accepts duplicate rows that resolve to the same role', () => {
    const result = resolveDashboardAccess([
      { role: 'teacher', display_name: 'Dup', is_active: true },
      { role: 'Teacher', display_name: 'Dup', is_active: true },
    ])

    expect(result).toEqual({ status: 'granted', user: { role: 'teacher', name: 'Dup' } })
  })

  it('ignores inactive duplicates and uses the active role record', () => {
    const result = resolveDashboardAccess([
      { role: 'admin', display_name: 'Old', is_active: false },
      { role: 'teacher', display_name: 'Current', is_active: true },
    ])

    expect(result).toEqual({ status: 'granted', user: { role: 'teacher', name: 'Current' } })
  })
})
