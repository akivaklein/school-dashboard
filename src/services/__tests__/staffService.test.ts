import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { FALLBACK_STAFF_MEMBERS, loadStaffMembers } from '../staffService'

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
})
