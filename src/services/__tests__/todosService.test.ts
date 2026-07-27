import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTodo } from '../todosService'
import { supabase } from '../../supabaseClient'

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('createTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('trims task text before saving', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 1, date: '2026-07-27', time: '', text: 'Review forms', category: 'general', done: false }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    ;(supabase.from as any).mockReturnValue({ insert })

    await expect(createTodo({ date: '2026-07-27', time: '', text: '  Review forms  ', category: 'general' })).resolves.toMatchObject({ text: 'Review forms' })
    expect(insert).toHaveBeenCalledWith([expect.objectContaining({ text: 'Review forms' })])
  })
})
