import { describe, expect, it } from 'vitest'
import { buildClassroomCoverageForecast, debugCoverageForecastMatching } from '../scheduleCoverageForecast'

const classes = [
  { id: 'a', name: 'Dargei Alef' },
  { id: 'b', name: 'Dargei Beis' },
]

const schedulePeriods = [
  { id: 1, time: '10:10 - 11:10', subject: 'Gemara / Skills Rotation', type: 'class' },
  { id: 2, time: '11:20 - 12:05', subject: 'Kriah / Writing Block', type: 'class' },
]

const alefRoster = [
  { id: 1, name: 'Bloom Yair' },
  { id: 2, name: 'Goldberger Yossi' },
  { id: 3, name: 'Moskowitz Meir Shulem' },
  { id: 4, name: 'Schwartz Moishe Michael' },
  { id: 5, name: 'Haddad Moshe Chaim' },
  { id: 6, name: 'Levitz Avrohom' },
  { id: 7, name: 'Feltman Daniel' },
]

const students = [
  ...alefRoster,
  { id: 101, name: 'Cohen Dovid', classId: 'b' },
]

const nowTuesday = new Date('2026-08-04T10:15:00')

// Shape mirrors runtime rows saved in therapy_schedule.schedule_data by SetupTherapyScheduleSection.
function loadTherapyScheduleLikeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'support-slot-1',
    studentId: 1,
    therapistName: 'Shelly Wagschal',
    staffType: 'Social Counseling',
    day: 'Wednesday',
    time: '10:10 AM',
    endTime: '10:40 AM',
    duration: 30,
    service: 'Counseling',
    frequency: 'Weekly',
    location: 'Counseling Office',
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

function forecastFor({
  therapySchedule,
  withStudentAssignments = false,
  horizonDays = 3,
}: {
  therapySchedule: Array<Record<string, unknown>>
  withStudentAssignments?: boolean
  horizonDays?: number
}) {
  const studentRows = withStudentAssignments
    ? students.map(student => {
        if (student.id !== 1) return { ...student, therapyAssignments: [] }
        return {
          ...student,
          therapyAssignments: [
            {
              id: 'therapy-1',
              provider: 'Shelly Wagschal',
              serviceType: 'Counseling',
              day: 'Wednesday',
              date: '',
              startTime: '10:10 AM',
              endTime: '10:40 AM',
              recurrence: 'Weekly',
              affectedPeriod: 'Period 1: Gemara / Skills Rotation',
              customDays: [],
              notes: 'Weekly support',
              active: true,
            },
          ],
        }
      })
    : students

  return buildClassroomCoverageForecast({
    students: studentRows,
    classes,
    schedulePeriods,
    therapySchedule,
    horizonDays,
    now: nowTuesday,
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

describe('schedule coverage forecast runtime integration', () => {
  it('uses loadTherapySchedule runtime row shape and shows Bloom Wednesday drop and return', () => {
    const forecast = forecastFor({
      therapySchedule: [loadTherapyScheduleLikeRow()],
      horizonDays: 3,
    })

    const alef = classForecast(forecast, 'a')

    const tuesdayNow = pointBy(alef, 'Tuesday', 10 * 60 + 15)
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    const wedReturn = pointBy(alef, 'Wednesday', 10 * 60 + 40)

    expect(tuesdayNow.expectedCount).toBe(7)
    expect(wedStart.expectedCount).toBe(6)
    expect(wedReturn.expectedCount).toBe(7)

    expect(wedStart.missingStudents).toHaveLength(1)
    expect(wedStart.missingStudents[0].studentName).toBe('Bloom Yair')
    expect(wedStart.missingStudents[0].providerName).toBe('Shelly Wagschal')
    expect(wedStart.missingStudents[0].serviceType).toBe('Counseling')
    expect(wedStart.missingStudents[0].departureTime).toBe('10:10 AM')
    expect(wedStart.missingStudents[0].expectedReturnTime).toBe('10:40 AM')
  })

  it('supports rows with student name but no class fields', () => {
    const forecast = forecastFor({
      therapySchedule: [
        loadTherapyScheduleLikeRow({
          studentId: undefined,
          student: 'Bloom Yair',
          classId: '',
          className: '',
          missedSubject: '',
          periodId: undefined,
        }),
      ],
      horizonDays: 3,
    })

    const alef = classForecast(forecast, 'a')
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    expect(wedStart.expectedCount).toBe(6)
  })

  it('does not require optional subject/period fields', () => {
    const forecast = forecastFor({
      therapySchedule: [
        loadTherapyScheduleLikeRow({
          periodId: undefined,
          missedSubject: '',
          subject: '',
        }),
      ],
      horizonDays: 3,
    })

    const alef = classForecast(forecast, 'a')
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    expect(wedStart.expectedCount).toBe(6)
  })

  it('merges student therapyAssignments when therapy_schedule is empty', () => {
    const forecast = forecastFor({
      therapySchedule: [],
      withStudentAssignments: true,
      horizonDays: 3,
    })

    const alef = classForecast(forecast, 'a')
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    expect(wedStart.expectedCount).toBe(6)
    expect(wedStart.missingStudents[0].providerName).toBe('Shelly Wagschal')
  })

  it('supports custom weekday recurrence', () => {
    const forecast = forecastFor({
      therapySchedule: [
        loadTherapyScheduleLikeRow({
          day: '',
          customWeekdays: ['Wednesday'],
          recurrence: 'Custom',
        }),
      ],
      horizonDays: 3,
    })

    const alef = classForecast(forecast, 'a')
    const wedStart = pointBy(alef, 'Wednesday', 10 * 60 + 10)
    expect(wedStart.expectedCount).toBe(6)
  })

  it('debug diagnostics report row acceptance and rejection reasons', () => {
    const diagnostics = debugCoverageForecastMatching({
      students,
      classes,
      therapySchedule: [
        loadTherapyScheduleLikeRow(),
        loadTherapyScheduleLikeRow({ id: 'bad-row', studentId: 9999, student: 'Unknown Student' }),
      ],
      horizonDays: 3,
      now: nowTuesday,
    })

    expect(diagnostics.sourceRowsFromTherapySchedule).toBe(2)
    expect(diagnostics.insideWindow).toBe(2)
    expect(diagnostics.matchedToStudent).toBe(1)
    expect(diagnostics.rejected.missingStudentMatch).toBe(1)
    expect(diagnostics.acceptedForCoverage).toBe(1)
    expect(diagnostics.sampleRuntimeFields.length).toBeGreaterThan(0)
  })
})
