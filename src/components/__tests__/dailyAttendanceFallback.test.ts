import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const dashboardSource = readFileSync(path.resolve(import.meta.dirname, '../Dashboard.tsx'), 'utf8')

describe('daily attendance dashboard loading', () => {
  it('does not fall back from daily attendance to live classroom status', () => {
    expect(dashboardSource).not.toContain('databaseStudent.status ||\n        \'not-arrived\'')
    expect(dashboardSource).not.toContain('databaseStudent.status ||\n          \'present\'')
    expect(dashboardSource).toContain('resolveDailyAttendanceStatusForDate')
  })
})