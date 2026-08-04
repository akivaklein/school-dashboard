import { resolveStudentClassId } from './dashboardData'

type StudentLike = Record<string, any>
type ClassLike = { id: string; name: string }
type PeriodLike = { id: number; time: string; subject?: string; type?: string }
type TherapyRowLike = Record<string, any>

type PlanningDay = {
  dayName: string
  dateIso: string
  sequence: number
}

type ClassBlock = {
  id: number
  subject: string
  timeLabel: string
  startMinutes: number
  endMinutes: number
}

type ActivePullout = {
  studentId: number | string
  studentName: string
  providerName: string
  serviceType: string
  whereGoing: string
  departureTime: string
  expectedReturnTime: string
}

export type CoveragePoint = {
  key: string
  classId: string
  className: string
  dayName: string
  dateIso: string
  minuteOfDay: number
  label: string
  expectedCount: number
  rosterCount: number
  classBlock: {
    periodId: number
    subject: string
    timeLabel: string
  }
  expectedStudents: Array<{ id: number | string; name: string }>
  missingStudents: ActivePullout[]
}

export type ClassForecast = {
  classId: string
  className: string
  rosterCount: number
  points: CoveragePoint[]
}

type BuildForecastArgs = {
  students: StudentLike[]
  classes: ClassLike[]
  schedulePeriods: PeriodLike[]
  therapySchedule: TherapyRowLike[]
  horizonDays: number
  now?: Date
}

const SCHOOL_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function toIsoDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function normalizedDayName(value: string) {
  const day = String(value || '').trim().toLowerCase()
  if (!day) return ''
  if (day.startsWith('mon')) return 'Monday'
  if (day.startsWith('tue')) return 'Tuesday'
  if (day.startsWith('wed')) return 'Wednesday'
  if (day.startsWith('thu')) return 'Thursday'
  if (day.startsWith('fri')) return 'Friday'
  return ''
}

function parseTimeToMinutes(rawTime: string) {
  const text = String(rawTime || '').trim()
  if (!text) return Number.NaN

  const amPmMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (amPmMatch) {
    let hour = Number(amPmMatch[1])
    const minute = Number(amPmMatch[2])
    const period = String(amPmMatch[3]).toUpperCase()
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return hour * 60 + minute
  }

  const plainMatch = text.match(/^(\d{1,2}):(\d{2})$/)
  if (!plainMatch) return Number.NaN
  const hour = Number(plainMatch[1])
  const minute = Number(plainMatch[2])

  // School schedule times without AM/PM are interpreted as daytime blocks.
  if (hour === 12) return 12 * 60 + minute
  if (hour >= 1 && hour <= 6) return (hour + 12) * 60 + minute
  return hour * 60 + minute
}

function formatMinutes(minutes: number) {
  const total = ((minutes % 1440) + 1440) % 1440
  let hour = Math.floor(total / 60)
  const minute = total % 60
  const period = hour >= 12 ? 'PM' : 'AM'
  hour %= 12
  if (hour === 0) hour = 12
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`
}

function parseDurationMinutes(rawDuration: unknown) {
  if (typeof rawDuration === 'number' && Number.isFinite(rawDuration)) return rawDuration
  const text = String(rawDuration || '').trim()
  if (!text) return 30
  const numberMatch = text.match(/(\d+)/)
  if (!numberMatch) return 30
  return Number(numberMatch[1])
}

function normalizeName(value: string) {
  return String(value || '').trim().toLowerCase()
}

function resolveForecastStudentClassId(student: StudentLike, classes: ClassLike[]) {
  const explicitClassId = String(student.classId || student.class_id || '').trim()
  if (explicitClassId) return explicitClassId

  const className = normalizeName(String(student.className || ''))
  if (className) {
    const classMatch = (classes || []).find(item => normalizeName(item.name) === className)
    if (classMatch) return classMatch.id
  }

  return resolveStudentClassId(student)
}

function parsePeriodId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = String(value || '').trim().toLowerCase()
  if (!text) return null
  const digits = text.match(/(\d+)/)
  if (!digits) return null
  return Number(digits[1])
}

function buildPlanningDays(horizonDays: number, now: Date) {
  const maxDays = Math.max(1, Math.min(5, horizonDays))
  const days: PlanningDay[] = []
  const cursor = startOfDay(now)

  for (let offset = 0; offset < 14 && days.length < maxDays; offset += 1) {
    const current = new Date(cursor)
    current.setDate(cursor.getDate() + offset)
    const weekday = current.getDay()
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday]
    if (!SCHOOL_DAY_NAMES.includes(dayName)) continue
    days.push({
      dayName,
      dateIso: toIsoDate(current),
      sequence: days.length,
    })
  }

  return days
}

function parseClassBlocks(schedulePeriods: PeriodLike[]) {
  return (schedulePeriods || [])
    .filter(period => String(period?.type || 'class') === 'class')
    .map(period => {
      const [startRaw, endRaw] = String(period.time || '').split('-').map(part => part.trim())
      const start = parseTimeToMinutes(startRaw)
      const end = parseTimeToMinutes(endRaw)
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
      return {
        id: Number(period.id),
        subject: String(period.subject || 'Class Session'),
        timeLabel: String(period.time || ''),
        startMinutes: start,
        endMinutes: end,
      } as ClassBlock
    })
    .filter(Boolean) as ClassBlock[]
}

function findClassBlockAtMinute(blocks: ClassBlock[], minute: number) {
  return blocks.find(block => minute >= block.startMinutes && minute < block.endMinutes) || null
}

function therapyDateMatches(row: TherapyRowLike, day: PlanningDay) {
  const rowDay = normalizedDayName(String(row.day || ''))
  const rowDate = String(row.date || row.sessionDate || '').trim()

  if (rowDate) {
    const normalizedDate = rowDate.includes('T') ? rowDate.slice(0, 10) : rowDate
    if (normalizedDate !== day.dateIso) return false
  }

  if (rowDay) {
    return rowDay === day.dayName
  }

  return Boolean(rowDate)
}

function therapyClassMatches(row: TherapyRowLike, classInfo: ClassLike) {
  const classId = String(row.classId || row.class_id || '').trim()
  if (classId) return classId === classInfo.id

  const className = normalizeName(String(row.className || row.class || ''))
  if (className) return className === normalizeName(classInfo.name)

  return false
}

function resolveAppointmentWindow(row: TherapyRowLike) {
  const startMinutes = parseTimeToMinutes(String(row.time || row.startTime || ''))
  if (!Number.isFinite(startMinutes)) return null

  const explicitEnd = parseTimeToMinutes(String(row.endTime || row.end || ''))
  const duration = parseDurationMinutes(row.duration)
  const endMinutes = Number.isFinite(explicitEnd) ? explicitEnd : startMinutes + duration

  if (!Number.isFinite(endMinutes) || endMinutes <= startMinutes) return null

  return {
    startMinutes,
    endMinutes,
    departureTime: formatMinutes(startMinutes),
    expectedReturnTime: formatMinutes(endMinutes),
  }
}

function resolveStudentIdentity(row: TherapyRowLike, rosterMap: Map<number, StudentLike>, nameMap: Map<string, StudentLike>) {
  const rowStudentId = Number(row.studentId ?? row.student_id)
  if (Number.isFinite(rowStudentId) && rosterMap.has(rowStudentId)) {
    const student = rosterMap.get(rowStudentId)!
    return {
      id: student.id,
      name: String(student.name || 'Student'),
    }
  }

  const studentName = normalizeName(String(row.student || row.studentName || ''))
  if (studentName && nameMap.has(studentName)) {
    const student = nameMap.get(studentName)!
    return {
      id: student.id,
      name: String(student.name || 'Student'),
    }
  }

  return null
}

function resolveAppointmentPeriodHint(row: TherapyRowLike) {
  const directHint = parsePeriodId(row.periodId ?? row.period_id ?? row.period)
  if (directHint) return directHint

  const subjectText = String(row.missedSubject || row.subject || '')
  const subjectHint = subjectText.match(/period\s*(\d+)/i)
  if (!subjectHint) return null
  return Number(subjectHint[1])
}

function appointmentMatchesBlock(row: TherapyRowLike, block: ClassBlock) {
  const hintedPeriodId = resolveAppointmentPeriodHint(row)
  if (hintedPeriodId) return hintedPeriodId === block.id

  const hintedSubject = normalizeName(String(row.missedSubject || row.subject || ''))
  if (!hintedSubject) return true

  if (hintedSubject.includes('period')) {
    const hintedFromLabel = parsePeriodId(hintedSubject)
    if (hintedFromLabel) return hintedFromLabel === block.id
  }

  return hintedSubject === normalizeName(block.subject)
}

function currentMinutes(now: Date) {
  return now.getHours() * 60 + now.getMinutes()
}

export function buildClassroomCoverageForecast({
  students,
  classes,
  schedulePeriods,
  therapySchedule,
  horizonDays,
  now = new Date(),
}: BuildForecastArgs): ClassForecast[] {
  const planningDays = buildPlanningDays(horizonDays, now)
  const blocks = parseClassBlocks(schedulePeriods)
  if (planningDays.length === 0 || blocks.length === 0) {
    return []
  }

  const todayIso = toIsoDate(now)
  const nowMinutes = currentMinutes(now)

  return (classes || []).map(classInfo => {
    const roster = (students || []).filter(student => resolveForecastStudentClassId(student, classes || []) === classInfo.id)
    const rosterMap = new Map<number, StudentLike>()
    const rosterNameMap = new Map<string, StudentLike>()

    roster.forEach(student => {
      const numericId = Number(student.id)
      if (Number.isFinite(numericId)) {
        rosterMap.set(numericId, student)
      }
      rosterNameMap.set(normalizeName(String(student.name || '')), student)
    })

    const dayRows = planningDays.map(day => {
      const relevantRows = (therapySchedule || []).filter(row => therapyDateMatches(row, day) && therapyClassMatches(row, classInfo))

      const normalizedRows = relevantRows
        .map(row => {
          const identity = resolveStudentIdentity(row, rosterMap, rosterNameMap)
          if (!identity) return null
          const window = resolveAppointmentWindow(row)
          if (!window) return null

          return {
            row,
            studentId: identity.id,
            studentName: identity.name,
            startMinutes: window.startMinutes,
            endMinutes: window.endMinutes,
            departureTime: window.departureTime,
            expectedReturnTime: window.expectedReturnTime,
            providerName: String(row.therapistName || row.staffName || row.providerName || 'Unassigned Provider'),
            serviceType: String(row.service || row.type || row.staffType || 'Pullout Service'),
            whereGoing: String(row.location || row.destination || row.service || row.type || 'Support Session'),
          }
        })
        .filter(Boolean) as Array<{
        row: TherapyRowLike
        studentId: number | string
        studentName: string
        startMinutes: number
        endMinutes: number
        departureTime: string
        expectedReturnTime: string
        providerName: string
        serviceType: string
        whereGoing: string
      }>

      const timeSet = new Set<number>()
      normalizedRows.forEach(item => {
        timeSet.add(item.startMinutes)
        timeSet.add(item.endMinutes)
      })

      if (day.dateIso === todayIso) {
        timeSet.add(nowMinutes)
      }

      const sortedTimes = Array.from(timeSet).sort((a, b) => a - b)

      const points = sortedTimes
        .map(minute => {
          const activeBlock = findClassBlockAtMinute(blocks, minute)
          if (!activeBlock) return null

          const activeRows = normalizedRows.filter(item => {
            const overlapsMinute = minute >= item.startMinutes && minute < item.endMinutes
            if (!overlapsMinute) return false

            const overlapsBlock = item.startMinutes < activeBlock.endMinutes && item.endMinutes > activeBlock.startMinutes
            if (!overlapsBlock) return false

            return appointmentMatchesBlock(item.row, activeBlock)
          })

          const missingByStudent = new Map<string, ActivePullout>()
          activeRows.forEach(item => {
            const key = `${item.studentId}`
            const existing = missingByStudent.get(key)

            if (!existing) {
              missingByStudent.set(key, {
                studentId: item.studentId,
                studentName: item.studentName,
                whereGoing: item.whereGoing,
                providerName: item.providerName,
                serviceType: item.serviceType,
                departureTime: item.departureTime,
                expectedReturnTime: item.expectedReturnTime,
              })
              return
            }

            existing.providerName = `${existing.providerName} + ${item.providerName}`
            existing.serviceType = `${existing.serviceType} + ${item.serviceType}`
            existing.whereGoing = `${existing.whereGoing} + ${item.whereGoing}`
            existing.departureTime = existing.departureTime <= item.departureTime ? existing.departureTime : item.departureTime
            existing.expectedReturnTime = existing.expectedReturnTime >= item.expectedReturnTime ? existing.expectedReturnTime : item.expectedReturnTime
          })

          const missingStudentIds = new Set(Array.from(missingByStudent.values()).map(item => String(item.studentId)))
          const expectedStudents = roster
            .filter(student => !missingStudentIds.has(String(student.id)))
            .map(student => ({ id: student.id, name: String(student.name || 'Student') }))

          const missingStudents = Array.from(missingByStudent.values()).sort((a, b) => a.studentName.localeCompare(b.studentName))

          const label = day.dateIso === todayIso && minute === nowMinutes
            ? 'Now'
            : `${day.dayName.slice(0, 3)} ${formatMinutes(minute)}`

          return {
            key: `${classInfo.id}|${day.dateIso}|${minute}`,
            classId: classInfo.id,
            className: classInfo.name,
            dayName: day.dayName,
            dateIso: day.dateIso,
            minuteOfDay: minute,
            label,
            expectedCount: expectedStudents.length,
            rosterCount: roster.length,
            classBlock: {
              periodId: activeBlock.id,
              subject: activeBlock.subject,
              timeLabel: activeBlock.timeLabel,
            },
            expectedStudents,
            missingStudents,
          } as CoveragePoint
        })
        .filter(Boolean) as CoveragePoint[]

      return points
    })

    const points = dayRows.flat().sort((a, b) => {
      if (a.dateIso !== b.dateIso) return a.dateIso.localeCompare(b.dateIso)
      return a.minuteOfDay - b.minuteOfDay
    })

    return {
      classId: classInfo.id,
      className: classInfo.name,
      rosterCount: roster.length,
      points,
    }
  })
}
