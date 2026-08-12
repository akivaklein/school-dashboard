import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const srcRoot = path.resolve(__dirname, '../..')

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

const REMOVED_REPORTS_SYMBOLS = ['buildReportsOverview', 'reportsUtils', 'AttendanceReportsPanel', 'GradeReportsPage']

describe('removed Reports functionality', () => {
  it('leaves no stale references in the secure source tree', () => {
    const offenders = listSourceFiles(srcRoot)
      .filter(file => {
        const contents = readFileSync(file, 'utf8')
        return REMOVED_REPORTS_SYMBOLS.some(symbol => contents.includes(symbol))
      })
      .map(file => path.relative(srcRoot, file))
      .filter(file => !file.endsWith('removedReportsReferences.test.ts'))

    expect(offenders).toEqual([])
  })

  it('does not keep the removed reports helper module', () => {
    expect(existsSync(path.join(srcRoot, 'components/reportsUtils.ts'))).toBe(false)
  })

  it('keeps the dashboard free of a Reports Overview panel', () => {
    const dashboard = readFileSync(path.join(srcRoot, 'components/Dashboard.tsx'), 'utf8')

    expect(dashboard).not.toContain('Reports Overview')
    expect(dashboard).not.toContain('reportsOverview')
  })
})
