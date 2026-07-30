import { describe, expect, it } from 'vitest'
import { getSetupSectionMeta } from '../setupCenterUtils'

describe('getSetupSectionMeta', () => {
  it('returns polished metadata for the active setup section', () => {
    const meta = getSetupSectionMeta('staff-directory', [{ id: 'staff-directory', label: 'Staff Directory' }])

    expect(meta).toEqual({
      sectionSubtitle: 'Edit staffing records and keep teams organized.',
      primaryActionLabel: 'Manage Staff Directory',
      activeTabLabel: 'Staff Directory',
    })
  })

  it('falls back to defaults for unsupported or unknown sections', () => {
    const meta = getSetupSectionMeta('custom-section', [])

    expect(meta).toEqual({
      sectionSubtitle: 'Review setup details and keep school operations aligned.',
      primaryActionLabel: 'Review Section',
      activeTabLabel: 'Setup Center',
    })
  })
})
