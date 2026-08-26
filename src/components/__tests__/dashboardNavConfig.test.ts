import { describe, expect, it } from 'vitest'
import { getRoleNavConfig } from '../dashboardNavConfig'

describe('getRoleNavConfig', () => {
  it('returns secure admin areas only', () => {
    const config = getRoleNavConfig('admin')

    const areaIds = config.topAreas.map(area => area.id)
    expect(areaIds).toEqual(['dashboard', 'students', 'classes', 'points', 'school-day', 'store', 'staff', 'settings'])
    expect(config.submenuByArea.points?.[0]?.id).toBe('behavior')
    expect(config.submenuByArea.settings?.[0]?.id).toBe('setup')
  })

  it('returns focused teacher sections', () => {
    const config = getRoleNavConfig('teacher')

    const studentsArea = config.topAreas.find(area => area.id === 'students')
    expect(studentsArea?.defaultPage).toBe('students')
    expect(config.submenuByArea.students?.[0]?.id).toBe('students')
    expect(config.submenuByArea.points?.[0]?.id).toBe('behavior')
  })

  it('returns store-only school-day navigation for store role', () => {
    const config = getRoleNavConfig('store')

    expect(config.topAreas).toEqual([
      {
        id: 'school-day',
        label: 'School Day',
        defaultPage: 'store',
        pages: ['store'],
      },
    ])
    expect(config.submenuByArea['school-day'].map(item => item.id)).toEqual(['store'])
  })

  it('returns focused therapist navigation for therapist role', () => {
    const config = getRoleNavConfig('therapist')

    const areaIds = config.topAreas.map(area => area.id)
    expect(areaIds).toEqual(['students', 'store'])
    expect(config.submenuByArea.students?.[0]?.label).toBe('My Students')
    expect(config.submenuByArea.store.map(item => item.id)).toEqual(['store'])
  })
})
