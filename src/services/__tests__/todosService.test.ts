import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTodo, updateTodo } from '../todosService'
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

  it('uses a fallback date when the input date is empty', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 2, date: '2026-07-27', time: '', text: 'Call parents', category: 'general', done: false }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    ;(supabase.from as any).mockReturnValue({ insert })

    await createTodo({ date: '   ', time: '', text: 'Call parents', category: 'general' })

    expect(insert).toHaveBeenCalledWith([expect.objectContaining({ date: expect.any(String) })])
  })
})

describe('updateTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes empty text and category updates', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 3, date: '2026-07-27', time: '', text: 'Review forms', category: 'general', done: false }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    ;(supabase.from as any).mockReturnValue({ update })

    await expect(updateTodo(3, { text: '   ', category: '   ' })).resolves.toMatchObject({ text: 'Review forms' })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ text: '', category: 'general' }))
  })
})
