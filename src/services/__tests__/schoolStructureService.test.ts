import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { loadClasses, upsertClass } from '../schoolStructureService'

describe('schoolStructureService', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('loads persisted classes ordered by name', async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [{ id: 'yk-a', name: '8th Grade', grade: '8th Grade', teacher: 'Rabbi Schults', division_key: 'yeshiva_ketana' }],
      error: null,
    })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    fromMock.mockReturnValue({ select: selectMock })

    const rows = await loadClasses()

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('yk-a')
  })

  it('returns an empty array instead of throwing when loading fails', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'nope' } })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    fromMock.mockReturnValue({ select: selectMock })

    const rows = await loadClasses()

    expect(rows).toEqual([])
  })

  it('upserts a class keyed by id so it survives refresh', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    fromMock.mockReturnValue({ upsert: upsertMock })

    const ok = await upsertClass({ id: 'gemara-level-2', name: 'Gemara Level 2', grade: '8', teacher: 'Rabbi Klein', divisionKey: 'yeshiva_ketana' })

    expect(ok).toBe(true)
    expect(upsertMock).toHaveBeenCalledWith(
      { id: 'gemara-level-2', name: 'Gemara Level 2', grade: '8', teacher: 'Rabbi Klein', division_key: 'yeshiva_ketana' },
      { onConflict: 'id' },
    )
  })
})
