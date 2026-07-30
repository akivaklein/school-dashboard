import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLoginStats } from '../loginSessionService'
import { supabase } from '../../supabaseClient'

describe('getLoginStats', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('requests the stable staff identifier for analytics aggregation', async () => {
    const gte = vi.fn().mockResolvedValue({ data: [], error: null })
    const select = vi.fn().mockReturnValue({ gte })
    const from = vi.fn().mockReturnValue({ select })
    vi.spyOn(supabase, 'from').mockImplementation(from as any)

    await getLoginStats(7)

    expect(select).toHaveBeenCalledWith(expect.stringContaining('staff_id'))
  })

  it('falls back to the staff name when the stored staff id is invalid', async () => {
    const gte = vi.fn().mockResolvedValue({
      data: [{
        id: 1,
        staff_id: 'not-a-number',
        staff_name: 'Rabbi Baum',
        role: 'teacher',
        login_time: '2026-07-01T10:00:00.000Z',
        logout_time: '2026-07-01T10:30:00.000Z',
        session_duration_seconds: 1800,
      }],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ gte })
    const from = vi.fn().mockReturnValue({ select })
    vi.spyOn(supabase, 'from').mockImplementation(from as any)

    const stats = await getLoginStats(7)

    expect(stats).toHaveProperty('staff-rabbi baum')
    expect(stats['staff-rabbi baum']).toMatchObject({
      name: 'Rabbi Baum',
      loginCount: 1,
    })
  })

  it('returns an empty stats object when the login data is unavailable', async () => {
    const gte = vi.fn().mockResolvedValue({ data: null, error: null })
    const select = vi.fn().mockReturnValue({ gte })
    const from = vi.fn().mockReturnValue({ select })
    vi.spyOn(supabase, 'from').mockImplementation(from as any)

    const stats = await getLoginStats(7)

    expect(stats).toEqual({})
  })
})
