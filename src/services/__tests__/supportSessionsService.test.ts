import { describe, expect, it } from 'vitest'
import { buildSupportSessionsStudentFilter } from '../supportSessionsService'

describe('buildSupportSessionsStudentFilter', () => {
  it('returns null when there are no valid numeric student IDs', () => {
    expect(buildSupportSessionsStudentFilter([])).toBeNull()
    expect(buildSupportSessionsStudentFilter([null, undefined, 'bad', -1, 0])).toBeNull()
  })

  it('normalizes, deduplicates, and formats student ID filters for realtime scope', () => {
    expect(buildSupportSessionsStudentFilter([7, '8', 7, '9', '08'])).toBe('student_id=in.(7,8,9)')
  })
})
