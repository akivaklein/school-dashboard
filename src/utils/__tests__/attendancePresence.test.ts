import { describe, expect, it } from 'vitest'
import { resolveClassroomStatusAfterAttendanceUpdate } from '../attendancePresence'

describe('resolveClassroomStatusAfterAttendanceUpdate', () => {
  it('keeps students in class when attendance is restored to present', () => {
    expect(resolveClassroomStatusAfterAttendanceUpdate('therapy', 'present')).toBe('present')
  })

  it('preserves left-early and absent transitions as out-of-class states', () => {
    expect(resolveClassroomStatusAfterAttendanceUpdate('present', 'left-early')).toBe('left-early')
    expect(resolveClassroomStatusAfterAttendanceUpdate('present', 'absent')).toBe('not-arrived')
  })
})
