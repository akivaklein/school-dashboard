import { describe, expect, it } from 'vitest'
import {
  cameToSchoolToday,
  getDailyAttendanceStatus,
  hasDailyAttendanceRecordForDate,
  isInClassroom,
  isInSchool,
  isCurrentlyOnCampus,
  resolveClassroomStatusAfterAttendanceUpdate,
  resolveDailyAttendanceStatusForDate,
} from '../attendancePresence'

describe('resolveClassroomStatusAfterAttendanceUpdate', () => {
  it('preserves live classroom status when daily attendance changes', () => {
    expect(resolveClassroomStatusAfterAttendanceUpdate('therapy', 'present')).toBe('therapy')
    expect(resolveClassroomStatusAfterAttendanceUpdate('present', 'absent')).toBe('present')
    expect(resolveClassroomStatusAfterAttendanceUpdate('with-bt', 'left-early')).toBe('with-bt')
  })

  it('falls back to unknown when no live classroom status exists yet', () => {
    expect(resolveClassroomStatusAfterAttendanceUpdate(null, 'present')).toBe('unknown')
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

  it('does not treat stale dailyStatus as today attendance', () => {
    const today = new Date('2026-09-07T10:00:00')

    expect(resolveDailyAttendanceStatusForDate({ dailyStatus: 'present', status: 'present', classLog: [] }, today)).toBe('not-arrived')
    expect(resolveDailyAttendanceStatusForDate({ dailyStatus: 'present', status: 'therapy' }, today)).toBe('not-arrived')
  })

  it('accepts same-day daily attendance records without consulting live location status', () => {
    const today = new Date('2026-09-07T10:00:00')
    const student = {
      dailyStatus: 'present',
      status: 'therapy',
      classLog: [
        { type: 'attendance-update', recordedAt: '2026-09-07T09:05:00' },
      ],
    }

    expect(hasDailyAttendanceRecordForDate(student, today)).toBe(true)
    expect(resolveDailyAttendanceStatusForDate(student, today)).toBe('present')
  })
})
