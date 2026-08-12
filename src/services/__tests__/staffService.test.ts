import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { FALLBACK_STAFF_MEMBERS, getStaffAccountStatus, getStaffById, getStaffByName, loadStaffMembers, updateStaffMember } from '../staffService'

describe('getStaffByName', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  function mockNameLookup(result: { data: unknown; error: unknown }) {
    const limitMock = vi.fn().mockResolvedValue(result)
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    fromMock.mockReturnValue({ select: selectMock })
    return { limitMock, selectMock }
  }

  it('returns null instead of throwing a 406 when zero staff rows match', async () => {
    const { limitMock } = mockNameLookup({ data: [], error: null })

    await expect(getStaffByName('Nobody')).resolves.toBeNull()
    expect(limitMock).toHaveBeenCalledWith(1)
  })

  it('returns the first record when duplicate staff rows exist', async () => {
    mockNameLookup({
      data: [
        { id: 3, name: 'Rabbi Klein', role: 'teacher', roles: ['teacher'], email: '', phone: '', active: true },
        { id: 9, name: 'Rabbi Klein', role: 'admin', roles: ['admin'], email: '', phone: '', active: true },
      ],
      error: null,
    })

    const member = await getStaffByName('Rabbi Klein')

    expect(member).toMatchObject({ id: 3, name: 'Rabbi Klein', roles: ['teacher'] })
  })

  it('returns null when the query is rejected by row level security', async () => {
    mockNameLookup({ data: null, error: { message: 'permission denied for table staff' } })

    await expect(getStaffByName('Rabbi Klein')).resolves.toBeNull()
  })
})

describe('getStaffById', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns null when no staff row matches the id', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqMock }) })

    await expect(getStaffById(404)).resolves.toBeNull()
  })

  it('maps a normal staff record', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { id: 1, name: 'Rabbi Baum', role: 'admin', roles: ['admin'], email: '', phone: '', active: true },
      error: null,
    })
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqMock }) })

    await expect(getStaffById(1)).resolves.toMatchObject({ id: 1, name: 'Rabbi Baum', roles: ['admin'] })
  })
})

describe('loadStaffMembers', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('treats missing active flags as active and normalizes roles', async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [{ id: 21, name: 'Test Staff', role: 'teacher', roles: null, email: '', phone: '', active: null }],
      error: null,
    })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })

    fromMock.mockReturnValue({ select: selectMock })

    const members = await loadStaffMembers()

    expect(members).toHaveLength(1)
    expect(members[0]).toMatchObject({ name: 'Test Staff', active: true, roles: ['teacher'] })
  })

  it('falls back to the built-in staff list when the staff table has no rows', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })

    fromMock.mockReturnValue({ select: selectMock })

    const members = await loadStaffMembers()

    expect(members).toEqual(FALLBACK_STAFF_MEMBERS)
  })

  it('classifies pending and disabled accounts clearly for invite state', () => {
    expect(getStaffAccountStatus({ accountState: 'pending', active: true })).toBe('pending-invitation')
    expect(getStaffAccountStatus({ accountState: 'inactive', active: true })).toBe('inactive-account')
    expect(getStaffAccountStatus({ accountState: 'missing', active: true })).toBe('no-account')
  })

  it('writes an audit entry after a staff update succeeds', async () => {
    const staffUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const auditInsert = vi.fn().mockResolvedValue({ error: null })

    fromMock.mockImplementation((table: string) => {
      if (table === 'staff') {
        return {
          update: vi.fn(() => ({ eq: staffUpdateEq })),
        }
      }

      if (table === 'audit_logs') {
        return {
          insert: auditInsert,
        }
      }

      return {}
    })

    const ok = await updateStaffMember(11, { roles: ['teacher'] })

    expect(ok).toBe(true)
    expect(auditInsert).toHaveBeenCalledWith(expect.objectContaining({
      action: 'staff_updated',
      target_table: 'staff',
    }))
  })
})
