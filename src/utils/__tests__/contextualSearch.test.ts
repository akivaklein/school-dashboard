import { describe, expect, it } from 'vitest'
import { matchesContextualSearch } from '../contextualSearch'

describe('matchesContextualSearch', () => {
  it('matches across multiple fields when the query is present', () => {
    expect(
      matchesContextualSearch('rosen', ['Yaakov Rosenberg', 42, 'Mesivta', 'North'])
    ).toBe(true)
  })

  it('ignores empty searches', () => {
    expect(matchesContextualSearch('', ['Yaakov Rosenberg'])).toBe(true)
  })

  it('returns false when no field contains the query', () => {
    expect(matchesContextualSearch('zebra', ['Yaakov Rosenberg', 42])).toBe(false)
  })
})
