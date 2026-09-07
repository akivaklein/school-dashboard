import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { buildSupportSessionsStudentFilter, listSupportSessions } from '../supportSessionsService'

describe('buildSupportSessionsStudentFilter', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns null when there are no valid numeric student IDs', () => {
    expect(buildSupportSessionsStudentFilter([])).toBeNull()
    expect(buildSupportSessionsStudentFilter([null, undefined, 'bad', -1, 0])).toBeNull()
  })

  it('normalizes, deduplicates, and formats student ID filters for realtime scope', () => {
    expect(buildSupportSessionsStudentFilter([7, '8', 7, '9', '08'])).toBe('student_id=in.(7,8,9)')
  })

  it('filters support session loading by scoped student IDs', async () => {
    const inMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const order = vi.fn().mockReturnValue({ in: inMock })
    const select = vi.fn().mockReturnValue({ order })
    fromMock.mockReturnValue({ select })

    await expect(listSupportSessions([7, '8', 7, 'bad'])).resolves.toEqual([])

    expect(fromMock).toHaveBeenCalledWith('support_sessions')
    expect(inMock).toHaveBeenCalledWith('student_id', [7, 8])
  })
})
