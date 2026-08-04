import { describe, expect, it } from 'vitest'
import {
  cameToSchoolToday,
  getDailyAttendanceStatus,
  isInClassroom,
  isInSchool,
  isCurrentlyOnCampus,
  resolveClassroomStatusAfterAttendanceUpdate,
} from '../attendancePresence'

describe('resolveClassroomStatusAfterAttendanceUpdate', () => {
  it('keeps students in class when attendance is restored to present', () => {
    expect(resolveClassroomStatusAfterAttendanceUpdate('therapy', 'present')).toBe('present')
  })

  it('preserves left-early and absent transitions as out-of-class states', () => {
    expect(resolveClassroomStatusAfterAttendanceUpdate('present', 'left-early')).toBe('left-early')
    expect(resolveClassroomStatusAfterAttendanceUpdate('present', 'absent')).toBe('not-arrived')
  })
})

describe('attendancePresence shared rules', () => {
  it('keeps blank attendance unconfirmed and out of school', () => {
    const student = { dailyStatus: '', status: 'not-arrived' }

    expect(getDailyAttendanceStatus(student)).toBe('unconfirmed')
    expect(cameToSchoolToday(student)).toBe(false)
    expect(isInSchool(student)).toBe(false)
    expect(isInClassroom(student)).toBe(false)
  })

  it('counts not-arrived as out of school', () => {
    const student = { dailyStatus: 'not-arrived', status: 'not-arrived' }

    expect(getDailyAttendanceStatus(student)).toBe('not-arrived')
    expect(cameToSchoolToday(student)).toBe(false)
    expect(isInSchool(student)).toBe(false)
  })

  it('counts present and late as came today', () => {
    expect(cameToSchoolToday({ dailyStatus: 'present', status: 'present' })).toBe(true)
    expect(cameToSchoolToday({ dailyStatus: 'late', status: 'late' })).toBe(true)
  })

  it('only counts therapy and BT statuses when the student has actually arrived', () => {
    expect(isInSchool({ dailyStatus: 'unconfirmed', status: 'therapy' })).toBe(false)
    expect(isInSchool({ dailyStatus: 'present', status: 'therapy' })).toBe(true)
    expect(isInSchool({ dailyStatus: 'present', status: 'with-bt' })).toBe(true)
    expect(isCurrentlyOnCampus({ dailyStatus: 'present', status: 'with-bt' })).toBe(true)
  })

  it('keeps dashboard-style counts aligned with attendance counts', () => {
    const students = [
      { dailyStatus: '', status: 'not-arrived' },
      { dailyStatus: 'not-arrived', status: 'not-arrived' },
      { dailyStatus: 'present', status: 'present' },
      { dailyStatus: 'late', status: 'therapy' },
      { dailyStatus: 'present', status: 'with-bt' },
    ]

    const cameToday = students.filter(cameToSchoolToday).length
    const inSchoolNow = students.filter(isInSchool).length
    const inClassrooms = students.filter(isInClassroom).length

    expect(cameToday).toBe(3)
    expect(inSchoolNow).toBe(3)
    expect(inClassrooms).toBe(1)
  })
})
