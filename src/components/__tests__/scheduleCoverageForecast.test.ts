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
  { id: 1, name: 'Bloom Yair', classId: 'a' },
  { id: 2, name: 'Levi Shimon', classId: 'a' },
  { id: 3, name: 'Cohen Dovid', classId: 'b' },
]

const now = new Date('2026-08-05T10:15:00')

function forecastFor(therapySchedule: Array<Record<string, unknown>>, horizonDays = 1) {
  return buildClassroomCoverageForecast({
    students,
    classes,
    schedulePeriods,
    therapySchedule,
    horizonDays,
    now,
  })
}

function classForecast(forecast: ReturnType<typeof forecastFor>, classId: string) {
  const item = forecast.find(entry => entry.classId === classId)
  if (!item) throw new Error(`Missing class forecast for ${classId}`)
  return item
}

function pointByMinute(classItem: ReturnType<typeof classForecast>, minute: number, dayName = 'Wednesday') {
  const point = classItem.points.find(entry => entry.dayName === dayName && entry.minuteOfDay === minute)
  if (!point) throw new Error(`Missing point ${dayName} ${minute}`)
  return point
}

describe('schedule coverage forecast', () => {
  it('future-day sessions do not affect today', () => {
    const forecast = forecastFor([
      {
        studentId: 1,
        student: 'Bloom Yair',
        classId: 'a',
        className: 'Dargei Alef',
        day: 'Thursday',
        date: '2026-08-06',
        time: '10:10 AM',
        endTime: '10:40 AM',
        service: 'Speech',
        therapistName: 'Yitzi Liebowitz',
        periodId: 1,
      },
    ], 3)

    const alef = classForecast(forecast, 'a')
    const nowPoint = pointByMinute(alef, 10 * 60 + 15)
    expect(nowPoint.label).toBe('Now')
    expect(nowPoint.expectedCount).toBe(2)

    const thursdayPoint = pointByMinute(alef, 10 * 60 + 10, 'Thursday')
    expect(thursdayPoint.expectedCount).toBe(1)
  })

  it('drops expected count at session start', () => {
    const forecast = forecastFor([
      {
        studentId: 1,
        student: 'Bloom Yair',
        classId: 'a',
        className: 'Dargei Alef',
        day: 'Wednesday',
        date: '2026-08-05',
        time: '10:20 AM',
        endTime: '10:50 AM',
        service: 'Speech',
        therapistName: 'Yitzi Liebowitz',
        periodId: 1,
      },
    ])

    const alef = classForecast(forecast, 'a')
    const startPoint = pointByMinute(alef, 10 * 60 + 20)
    expect(startPoint.expectedCount).toBe(1)
    expect(startPoint.missingStudents.map(item => item.studentName)).toEqual(['Bloom Yair'])
  })

  it('returns expected count after session end', () => {
    const forecast = forecastFor([
      {
        studentId: 1,
        student: 'Bloom Yair',
        classId: 'a',
        className: 'Dargei Alef',
        day: 'Wednesday',
        date: '2026-08-05',
        time: '10:20 AM',
        endTime: '10:50 AM',
        service: 'Speech',
        therapistName: 'Yitzi Liebowitz',
        periodId: 1,
      },
    ])

    const alef = classForecast(forecast, 'a')
    const returnPoint = pointByMinute(alef, 10 * 60 + 50)
    expect(returnPoint.expectedCount).toBe(2)
    expect(returnPoint.missingStudents).toHaveLength(0)
  })

  it('handles overlapping pullouts', () => {
    const forecast = forecastFor([
      {
        studentId: 1,
        student: 'Bloom Yair',
        classId: 'a',
        className: 'Dargei Alef',
        day: 'Wednesday',
        date: '2026-08-05',
        time: '10:20 AM',
        endTime: '10:50 AM',
        service: 'Speech',
        therapistName: 'Yitzi Liebowitz',
        periodId: 1,
      },
      {
        studentId: 2,
        student: 'Levi Shimon',
        classId: 'a',
        className: 'Dargei Alef',
        day: 'Wednesday',
        date: '2026-08-05',
        time: '10:25 AM',
        endTime: '10:45 AM',
        service: 'Counseling',
        therapistName: 'Shelly Wagschal',
        periodId: 1,
      },
    ])

    const alef = classForecast(forecast, 'a')
    const overlapPoint = pointByMinute(alef, 10 * 60 + 25)
    expect(overlapPoint.expectedCount).toBe(0)
    expect(overlapPoint.missingStudents).toHaveLength(2)
  })

  it('keeps classes and periods separate', () => {
    const forecast = forecastFor([
      {
        studentId: 1,
        student: 'Bloom Yair',
        classId: 'a',
        className: 'Dargei Alef',
        day: 'Wednesday',
        date: '2026-08-05',
        time: '10:20 AM',
        endTime: '10:50 AM',
        service: 'Speech',
        therapistName: 'Yitzi Liebowitz',
        periodId: 2,
        missedSubject: 'Kriah / Writing Block',
      },
      {
        studentId: 3,
        student: 'Cohen Dovid',
        classId: 'b',
        className: 'Dargei Beis',
        day: 'Wednesday',
        date: '2026-08-05',
        time: '11:20 AM',
        endTime: '11:40 AM',
        service: 'OT',
        therapistName: 'Tzvi Malks',
        periodId: 2,
        missedSubject: 'Kriah / Writing Block',
      },
    ])

    const alef = classForecast(forecast, 'a')
    const beis = classForecast(forecast, 'b')

    const alefPeriodOnePoint = pointByMinute(alef, 10 * 60 + 20)
    expect(alefPeriodOnePoint.expectedCount).toBe(2)

    const beisPeriodTwoPoint = pointByMinute(beis, 11 * 60 + 20)
    expect(beisPeriodTwoPoint.expectedCount).toBe(0)
  })
})
