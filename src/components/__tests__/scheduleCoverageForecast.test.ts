import { describe, expect, it } from 'vitest'
import { buildClassroomCoverageForecast } from '../scheduleCoverageForecast'

const classes = [
  { id: 'a', name: 'Dargei Alef' },
  { id: 'b', name: 'Dargei Beis' },
]

const schedulePeriods = [
  { id: 1, time: '10:10 - 11:10', subject: 'Gemara / Skills Rotation', type: 'class' },
  { id: 2, time: '11:20 - 12:05', subject: 'Kriah / Writing Block', type: 'class' },
]

const students = [
  // Intentionally missing class fields to verify fallback class mapping resolution.
  { id: 1, name: 'Bloom Yair' },
  // Class resolved from student record by class name.
  { id: 2, name: 'Levi Shimon', className: 'Dargei Alef' },
  { id: 3, name: 'Cohen Dovid', classId: 'b' },
]

const tuesdayNow = new Date('2026-08-04T10:15:00')

function makeSetupLikeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'support-slot-1',
    studentId: 1,
    therapistName: 'Yitzi Liebowitz',
    staffType: 'Speech',
    day: 'Wednesday',
    time: '10:10 AM',
    endTime: '10:40 AM',
    duration: 30,
    service: 'Speech',
    frequency: 'Weekly',
    location: 'Speech Room',
    supervisingBcba: '',
    teacherName: 'Rabbi Klein',
    missedSubject: 'Gemara / Skills Rotation',
    classId: 'a',
    className: 'Dargei Alef',
    division: 'mesivta',
    note: '',
    ...overrides,
  }
}

function forecastFor(therapySchedule: Array<Record<string, unknown>>, horizonDays = 1) {
  return buildClassroomCoverageForecast({
    students,
    classes,
    schedulePeriods,
    therapySchedule,
    horizonDays,
    now: tuesdayNow,
  })
}

function classForecast(forecast: ReturnType<typeof forecastFor>, classId: string) {
  const item = forecast.find(entry => entry.classId === classId)
  if (!item) throw new Error(`Missing class forecast for ${classId}`)
  return item
}

function pointBy(classItem: ReturnType<typeof classForecast>, dayName: string, minute: number) {
  const point = classItem.points.find(entry => entry.dayName === dayName && entry.minuteOfDay === minute)
  if (!point) throw new Error(`Missing point ${dayName} ${minute}`)
  return point
}

describe('schedule coverage forecast matching', () => {
  it('matches a schedule row with student name but no class name', () => {
    const forecast = forecastFor([
      makeSetupLikeRow({
        studentId: undefined,
        student: 'Bloom Yair',
        classId: '',
        className: '',
        missedSubject: '',
        periodId: undefined,
      }),
    ], 3)

    const alef = classForecast(forecast, 'a')
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    expect(wedStart.expectedCount).toBe(1)
    expect(wedStart.missingStudents.map(item => item.studentName)).toEqual(['Bloom Yair'])
  })

  it('supports recurring Wednesday sessions and start/end time points', () => {
    const forecast = forecastFor([
      makeSetupLikeRow({
        day: 'Wednesday',
        date: '',
        time: '10:10 AM',
        endTime: '10:50 AM',
      }),
    ], 3)

    const alef = classForecast(forecast, 'a')
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    const wedEnd = pointBy(alef, 'Wednesday', 10 * 60 + 50)

    expect(wedStart.expectedCount).toBe(1)
    expect(wedEnd.expectedCount).toBe(2)
  })

  it('Next 3 Days includes tomorrow session but does not affect today', () => {
    const forecast = forecastFor([
      makeSetupLikeRow({ day: 'Wednesday', date: '' }),
    ], 3)

    const alef = classForecast(forecast, 'a')
    const nowPoint = pointBy(alef, 'Tuesday', 10 * 60 + 15)
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)

    expect(nowPoint.label).toBe('Now')
    expect(nowPoint.expectedCount).toBe(2)
    expect(wedStart.expectedCount).toBe(1)
  })

  it('resolves student class from student record or class mapping', () => {
    const forecast = forecastFor([
      // Bloom has no class on student record; falls back to class mapping.
      makeSetupLikeRow({ studentId: 1, classId: '', className: '' }),
      // Levi resolves from className on student record.
      makeSetupLikeRow({ id: 'support-slot-2', studentId: 2, student: '', classId: '', className: '', therapistName: 'Shelly Wagschal' }),
    ], 3)

    const alef = classForecast(forecast, 'a')
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    expect(wedStart.expectedCount).toBe(0)
    expect(wedStart.missingStudents).toHaveLength(2)
  })

  it('blank optional period/subject fields do not block a valid match', () => {
    const forecast = forecastFor([
      makeSetupLikeRow({
        periodId: undefined,
        missedSubject: '',
        subject: '',
      }),
    ], 3)

    const alef = classForecast(forecast, 'a')
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    expect(wedStart.expectedCount).toBe(1)
  })

  it('supports date-specific sessions separately from recurring weekday rows', () => {
    const forecast = forecastFor([
      // This dated row lands on Thursday only.
      makeSetupLikeRow({ day: 'Wednesday', date: '2026-08-06', time: '10:20 AM', endTime: '10:40 AM' }),
    ], 3)

    const alef = classForecast(forecast, 'a')
    const tuesdayNowPoint = pointBy(alef, 'Tuesday', 10 * 60 + 15)
    expect(tuesdayNowPoint.expectedCount).toBe(2)

    const thursdayPoint = pointBy(alef, 'Thursday', 10 * 60 + 20)
    expect(thursdayPoint.expectedCount).toBe(1)
  })
})
