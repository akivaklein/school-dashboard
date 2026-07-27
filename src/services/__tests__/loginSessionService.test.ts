import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLoginStats } from '../loginSessionService'
import { supabase } from '../../supabaseClient'

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('getLoginStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests the stable staff identifier for analytics aggregation', async () => {
    const gte = vi.fn().mockResolvedValue({ data: [], error: null })
    const select = vi.fn().mockReturnValue({ gte })
    ;(supabase.from as any).mockReturnValue({ select })

    await getLoginStats(7)

    expect(select).toHaveBeenCalledWith(expect.stringContaining('staff_id'))
  })
})
