import { describe, expect, it } from 'vitest'
import { getRoleNavConfig } from '../dashboardNavConfig'

describe('getRoleNavConfig', () => {
  it('returns reports and setup areas for admin users', () => {
    const config = getRoleNavConfig('admin')

    const areaIds = config.topAreas.map(area => area.id)
    expect(areaIds).toContain('reports')
    expect(areaIds).toContain('setup')
    expect(config.submenuByArea.reports?.[0]?.id).toBe('todo')
  })

  it('returns teacher-focused sections for teacher roles', () => {
    const config = getRoleNavConfig('teacher')

    const studentsArea = config.topAreas.find(area => area.id === 'students')
    expect(studentsArea?.defaultPage).toBe('academics')
    expect(config.submenuByArea.students?.[0]?.id).toBe('academics')
  })

  it('returns store-only school-day navigation for store role', () => {
    const config = getRoleNavConfig('store')

    expect(config.topAreas).toEqual([
      {
        id: 'school-day',
        label: 'School Day',
        defaultPage: 'store',
        pages: ['store', 'teaching-mode'],
      },
    ])
    expect(config.submenuByArea['school-day'].map(item => item.id)).toEqual(['store', 'teaching-mode'])
  })

  it('falls back to staff navigation for non-admin non-teacher roles', () => {
    const config = getRoleNavConfig('therapist')

    const areaIds = config.topAreas.map(area => area.id)
    expect(areaIds).toEqual(['dashboard', 'school-day', 'support'])
    expect(config.submenuByArea.dashboard?.[0]?.label).toBe('My Students')
  })
})
