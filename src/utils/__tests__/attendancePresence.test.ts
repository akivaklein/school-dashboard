import { describe, expect, it } from 'vitest'
import {
  buildClassroomAttendanceScopeOptions,
  cameToSchoolToday,
  getCurrentLocationStatus,
  getDailyAttendanceStatus,
  getAttendanceHistory,
  getAttendanceCode,
  getAttendanceDateRange,
  getAttendanceWeekRange,
  getActiveAttendanceStudents,
  getStudentStatusDisplay,
  getWeeklyAttendanceCodes,
  hasDailyAttendanceRecordForDate,
  isInClassroom,
  isInSchool,
  isCurrentlyOnCampus,
  resolveClassroomStatusAfterAttendanceUpdate,
  resolveDailyAttendanceStatusForDate,
  resolveRealtimeDailyAttendanceStatus,
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

  it('treats a late arrival with a stale location as in school and in class', () => {
    const student = { dailyStatus: 'late', status: 'not-arrived' }

    expect(getCurrentLocationStatus(student)).toBe('present')
    expect(isInSchool(student)).toBe(true)
    expect(isInClassroom(student)).toBe(true)
  })

  it('counts left early as came today but no longer in school', () => {
    const student = { dailyStatus: 'left-early', status: 'present' }

    expect(cameToSchoolToday(student)).toBe(true)
    expect(getCurrentLocationStatus(student)).toBe('left-early')
    expect(isInSchool(student)).toBe(false)
    expect(isInClassroom(student)).toBe(false)
  })

  it('keeps a late arrival and early departure as separate same-day facts', () => {
    const student = {
      dailyStatus: 'late',
      status: 'present',
      departureDetails: { timeDeparted: '14:05' },
      classLog: [
        { type: 'attendance-update', attendanceStatus: 'late', recordedAt: '2026-09-13T09:20:00' },
        { type: 'departure-details', recordedAt: '2026-09-13T14:05:00' },
      ],
    }

    expect(getDailyAttendanceStatus(student)).toBe('late')
    expect(getCurrentLocationStatus(student)).toBe('left-early')
    expect(isInSchool(student)).toBe(false)
    expect(getWeeklyAttendanceCodes(student, new Date('2026-09-13T15:00:00'))[0]).toBe('L/LE')
  })

  it('uses the latest departure correction when building the weekly record', () => {
    const student = {
      classLog: [
        { type: 'attendance-update', attendanceStatus: 'late', recordedAt: '2026-09-13T09:20:00' },
        { type: 'departure-details', recordedAt: '2026-09-13T14:05:00' },
        { type: 'departure-cleared', recordedAt: '2026-09-13T14:10:00' },
      ],
    }

    expect(getWeeklyAttendanceCodes(student, new Date('2026-09-13T15:00:00'))[0]).toBe('L')
  })

  it('only counts therapy and BT statuses when the student has actually arrived', () => {
    expect(isInSchool({ dailyStatus: 'unconfirmed', status: 'therapy' })).toBe(false)
    expect(isInSchool({ dailyStatus: 'present', status: 'therapy' })).toBe(true)
    expect(isInSchool({ dailyStatus: 'present', status: 'with-bt' })).toBe(true)
    expect(isCurrentlyOnCampus({ dailyStatus: 'present', status: 'with-bt' })).toBe(true)
  })

  it('does not present live location as current when daily attendance is Not Arrived', () => {
    expect(getCurrentLocationStatus({ dailyStatus: 'not-arrived', status: 'present' })).toBe('not-confirmed')
    expect(getCurrentLocationStatus({ dailyStatus: 'not-arrived', status: 'therapy' })).toBe('not-confirmed')
    expect(getCurrentLocationStatus({ dailyStatus: 'present', status: 'therapy' })).toBe('therapy')
  })

  it('provides separate daily and gated location values for list cards', () => {
    expect(getStudentStatusDisplay({ dailyStatus: 'not-arrived', status: 'therapy' })).toEqual({
      dailyStatus: 'not-arrived',
      locationStatus: 'not-confirmed',
    })
    expect(getStudentStatusDisplay({ dailyStatus: 'late', status: 'with-bt' })).toEqual({
      dailyStatus: 'late',
      locationStatus: 'with-bt',
    })
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

  it('keeps a parent-call realtime update from reviving stale daily attendance', () => {
    const today = new Date('2026-09-07T10:00:00')
    const statusAfterParentCall = resolveRealtimeDailyAttendanceStatus(
      'present',
      [],
      [],
      today,
    )

    expect(statusAfterParentCall).toBe('not-arrived')
    expect(cameToSchoolToday({ dailyStatus: statusAfterParentCall, status: 'present' })).toBe(false)
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

  it('derives the current weekly record from dated attendance log entries', () => {
    const student = {
      classLog: [
        { type: 'attendance-update', attendanceStatus: 'present', note: 'Attendance marked present by Admin', recordedAt: '2026-09-06T08:00:00' },
        { type: 'attendance-update', note: 'Attendance marked late by Admin', recordedAt: '2026-09-07T08:15:00' },
        { type: 'attendance-update', attendanceStatus: 'absent', note: 'Attendance marked absent by Admin', recordedAt: '2026-09-08T08:30:00' },
        { type: 'attendance-update', attendanceStatus: 'present', note: 'Attendance marked present by Admin', recordedAt: '2026-08-31T08:00:00' },
      ],
    }

    expect(getWeeklyAttendanceCodes(student, new Date('2026-09-09T12:00:00'))).toEqual(['P', 'L', 'A', '', '', ''])
  })

  it('returns real attendance records from older months and a requested date range', () => {
    const student = {
      classLog: [
        { type: 'attendance-update', attendanceStatus: 'present', recordedAt: '2026-06-02T08:00:00' },
        { type: 'attendance-update', attendanceStatus: 'absent', recordedAt: '2026-07-15T08:00:00' },
        { type: 'attendance-update', attendanceStatus: 'late', arrivalTime: '09:12', recordedAt: '2026-08-20T09:12:00' },
      ],
    }

    expect(getAttendanceHistory(student).map(record => record.date)).toEqual(['2026-08-20', '2026-07-15', '2026-06-02'])
    expect(getAttendanceHistory(student, { startDate: '2026-07-01', endDate: '2026-07-31' })).toEqual([
      expect.objectContaining({ date: '2026-07-15', status: 'absent' }),
    ])
  })

  it('builds week, specific-date, and cross-month attendance ranges', () => {
    expect(getAttendanceWeekRange(new Date('2026-09-16T12:00:00'), 6)).toEqual({ startDate: '2026-09-13', endDate: '2026-09-18' })
    expect(getAttendanceDateRange('2026-07-15', '2026-07-15')).toEqual(['2026-07-15'])
    expect(getAttendanceDateRange('2026-07-30', '2026-08-02')).toEqual(['2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02'])
  })

  it('keeps one student aligned between Weekly Record and profile attendance', () => {
    const student = {
      classLog: [
        { type: 'attendance-update', attendanceStatus: 'present', recordedAt: '2026-09-13T08:05:00' },
        { type: 'attendance-update', attendanceStatus: 'late', arrivalTime: '09:14', recordedAt: '2026-09-14T09:14:00' },
        { type: 'departure-details', departureTime: '13:20', recordedAt: '2026-09-14T13:20:00' },
        { type: 'attendance-update', attendanceStatus: 'absent', recordedAt: '2026-09-15T08:10:00' },
        { type: 'attendance-update', attendanceStatus: 'present', recordedAt: '2026-06-02T08:00:00' },
      ],
    }
    const range = getAttendanceWeekRange(new Date('2026-09-16T12:00:00'), 6)
    const profileRecords = getAttendanceHistory(student, range)
    const profileCodesByDate = new Map(profileRecords.map(record => [record.date, getAttendanceCode(record)]))
    const profileCodes = getAttendanceDateRange(range.startDate, range.endDate).map(date => profileCodesByDate.get(date) || '')

    expect(getWeeklyAttendanceCodes(student, new Date('2026-09-16T12:00:00'), 6)).toEqual(profileCodes)
    expect(profileRecords.find(record => record.date === '2026-09-14')).toMatchObject({ status: 'late', arrivalTime: '09:14', leftEarly: true, departureTime: '13:20' })
    expect(getAttendanceHistory(student).some(record => record.date === '2026-06-02')).toBe(true)
  })

  it('keeps historical Late and Left Early details independently on the same date', () => {
    const student = {
      classLog: [
        { type: 'attendance-update', attendanceStatus: 'late', arrivalTime: '09:17', recordedAt: '2026-05-04T09:17:00' },
        { type: 'departure-details', departureTime: '13:42', recordedAt: '2026-05-04T13:42:00' },
      ],
    }

    expect(getAttendanceHistory(student)).toEqual([{
      date: '2026-05-04',
      status: 'late',
      arrivalTime: '09:17',
      departureTime: '13:42',
      leftEarly: true,
    }])
  })

  it('builds classroom class/group choices and excludes archived rosters', () => {
    expect(getActiveAttendanceStudents([
      { id: 1, is_active: true },
      { id: 2, is_active: false },
      { id: 3 },
    ]).map(student => student.id)).toEqual([1, 3])

    expect(buildClassroomAttendanceScopeOptions(
      [{ id: 'class-7', name: '7th Grade', teacher: 'Rabbi A' }],
      [
        { id: 'group-a', name: 'Aleph', teacher_name: 'Rabbi B', status: 'active' },
        { id: 'group-old', name: 'Old Group', teacher_name: 'Rabbi B', status: 'archived' },
      ],
    )).toEqual([
      { id: 'class-7', name: '7th Grade', teacher: 'Rabbi A', kind: 'class' },
      { id: 'group-a', name: 'Aleph', teacher: 'Rabbi B', kind: 'group' },
    ])
  })
})
