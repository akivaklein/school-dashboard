import { describe, expect, it } from 'vitest'
import { buildLoginAccountRoleLabel, createLoginAccounts, getLastName, getLoginRoleKey, getMatchingLoginAccounts } from '../dashboard/loginUserSearch'

describe('login user search', () => {
  it('pulls the last name from titles like Rabbi and Mrs.', () => {
    expect(getLastName('Rabbi Baum')).toBe('Baum')
    expect(getLastName('Mrs. Goldberg')).toBe('Goldberg')
  })

  it('matches by last name and full name while respecting the selected role', () => {
    const accounts = createLoginAccounts([
      { name: 'Rabbi Baum', role: 'admin' },
      { name: 'Mrs. Goldberg', role: 'therapist' },
      { name: 'Rabbi Klein', role: 'teacher' },
    ])

    const matches = getMatchingLoginAccounts(accounts, 'baum', 'admin')
    expect(matches).toHaveLength(1)
    expect(matches[0].name).toBe('Rabbi Baum')
  })

  it('allows full-name matches but not unrelated text', () => {
    const accounts = createLoginAccounts([
      { name: 'Rabbi Baum', role: 'admin' },
      { name: 'Rabbi Klein', role: 'teacher' },
    ])

    expect(getMatchingLoginAccounts(accounts, 'rabbi klein', 'teacher')).toHaveLength(1)
    expect(getMatchingLoginAccounts(accounts, 'zebra', 'teacher')).toHaveLength(0)
  })

  it('normalizes canteen preview roles to the store role key', () => {
    expect(getLoginRoleKey('canteen')).toBe('store')
    expect(buildLoginAccountRoleLabel('canteen')).toBe('Canteen')
  })
})
