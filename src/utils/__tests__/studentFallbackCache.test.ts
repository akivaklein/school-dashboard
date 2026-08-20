import { afterEach, describe, expect, it } from 'vitest'

const createMemoryStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

describe('studentFallbackCache', () => {
  afterEach(() => {
    delete (globalThis as { window?: Window }).window
    delete (globalThis as { localStorage?: Storage }).localStorage
  })

  it('stores and clears student fallback patches', async () => {
    const storage = createMemoryStorage()
    ;(globalThis as { window?: Window }).window = { localStorage: storage } as Window
    ;(globalThis as { localStorage?: Storage }).localStorage = storage as Storage

    const {
      getStudentFallbackPatchCount,
      mergeStudentFallbackPatch,
      readStudentFallbackPatches,
      clearStudentFallbackPatch,
    } = await import('../studentFallbackCache')

    expect(readStudentFallbackPatches()).toEqual({})

    mergeStudentFallbackPatch(7, { dailyStatus: 'present', withStaff: 'Rabbi Klein' })

    const patches = readStudentFallbackPatches()
    expect(getStudentFallbackPatchCount()).toBe(1)
    expect(patches['7']).toMatchObject({
      dailyStatus: 'present',
      withStaff: 'Rabbi Klein',
    })
    expect(typeof patches['7']._savedAt).toBe('string')

    clearStudentFallbackPatch(7)

    expect(readStudentFallbackPatches()).toEqual({})
    expect(getStudentFallbackPatchCount()).toBe(0)
  })
})
