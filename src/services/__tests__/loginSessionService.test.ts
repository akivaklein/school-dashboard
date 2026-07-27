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

  it('returns an empty stats object when the login data is unavailable', async () => {
    const gte = vi.fn().mockResolvedValue({ data: null, error: null })
    const select = vi.fn().mockReturnValue({ gte })
    const from = vi.fn().mockReturnValue({ select })
    vi.spyOn(supabase, 'from').mockImplementation(from as any)

    const stats = await getLoginStats(7)

    expect(stats).toEqual({})
  })
})
