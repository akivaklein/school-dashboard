import { describe, expect, it } from 'vitest'
import {
  buildAssignmentConflictIndex,
  buildAffectedPeriodOptions,
  clampToSchoolDay,
  createEmptyAssignment,
  deriveStudentAssignments,
  getAssignmentValidationIssues,
  getDefaultServiceTypeForProvider,
  toTimeParts,
  toLegacyTherapyFields,
} from '../therapistAssignmentsUtils'

describe('therapistAssignmentsUtils', () => {
  it('derives a legacy assignment when only legacy fields exist', () => {
    const student = {
      id: 6,
      assignedTherapist: 'Yitzi Liebowitz',
      therapyFrequency: 'Weekly',
      therapyNotes: 'Legacy note',
    }

    const assignments = deriveStudentAssignments(student)

    expect(assignments).toHaveLength(1)
    expect(assignments[0].provider).toBe('Yitzi Liebowitz')
    expect(assignments[0].recurrence).toBe('Weekly')
    expect(assignments[0].notes).toBe('Legacy note')
  })

  it('maps first active provider back to legacy fields', () => {
    const legacy = toLegacyTherapyFields([
      {
        id: 'a',
        provider: 'Ezriel',
        serviceType: 'BT Support',
        day: 'Monday',
        date: '',
        startTime: '10:00',
        endTime: '10:30',
        recurrence: 'Weekly',
        affectedPeriod: 'Period 1',
        notes: 'Prompting',
        active: true,
      },
    ])

    expect(legacy).toEqual({
      assignedTherapist: 'Ezriel',
      therapyFrequency: 'Weekly',
      therapyNotes: 'Prompting',
    })
  })

  it('detects student and provider conflicts for overlapping active assignments', () => {
    const conflicts = buildAssignmentConflictIndex([
      {
        studentId: 6,
        studentName: 'Levitz Avrohom',
        assignment: {
          id: 's1-a',
          provider: 'Yitzi Liebowitz',
          serviceType: 'OT',
          day: 'Monday',
          date: '',
          startTime: '10:00',
          endTime: '10:45',
          recurrence: 'Weekly',
          affectedPeriod: 'P1',
          notes: '',
          active: true,
        },
      },
      {
        studentId: 6,
        studentName: 'Levitz Avrohom',
        assignment: {
          id: 's1-b',
          provider: 'Ezriel',
          serviceType: 'BT Support',
          day: 'Monday',
          date: '',
          startTime: '10:30',
          endTime: '11:00',
          recurrence: 'Weekly',
          affectedPeriod: 'P1',
          notes: '',
          active: true,
        },
      },
      {
        studentId: 8,
        studentName: 'Schwartz Moishe Michael',
        assignment: {
          id: 's2-a',
          provider: 'Yitzi Liebowitz',
          serviceType: 'Speech',
          day: 'Monday',
          date: '',
          startTime: '10:20',
          endTime: '10:50',
          recurrence: 'Weekly',
          affectedPeriod: 'P2',
          notes: '',
          active: true,
        },
      },
    ])

    expect(conflicts.studentWarningsByStudentId['6']).toHaveLength(1)
    expect(conflicts.providerWarningsByAssignmentId['s1-a']).toHaveLength(1)
    expect(conflicts.providerWarningsByAssignmentId['s2-a']).toHaveLength(1)
  })

  it('returns provider default service mappings including BCBA and BT staff', () => {
    const providerMeta = [
      { name: 'Mrs. Bloom', specialty: 'BCBA' },
      { name: 'Ezriel', staffType: 'BT' },
    ]

    expect(getDefaultServiceTypeForProvider('Aryeh Schechter', providerMeta)).toBe('OT')
    expect(getDefaultServiceTypeForProvider('Tzvi Malks', providerMeta)).toBe('PT')
    expect(getDefaultServiceTypeForProvider('Yitzi Liebowitz', providerMeta)).toBe('Speech')
    expect(getDefaultServiceTypeForProvider('Shelly Wagschal', providerMeta)).toBe('Counseling')
    expect(getDefaultServiceTypeForProvider('Mrs. Bloom', providerMeta)).toBe('BCBA')
    expect(getDefaultServiceTypeForProvider('Ezriel', providerMeta)).toBe('BT Support')
  })

  it('builds affected period options from student class and configured schedule', () => {
    const options = buildAffectedPeriodOptions(
      { className: 'Dargei Alef' },
      [
        { id: 1, subject: 'Gemara / Skills Rotation' },
        { id: 4, subject: 'Lunch & Recess' },
        { id: 6, subject: 'English Reading' },
      ],
    )

    expect(options).toContain('Assigned Class: Dargei Alef')
    expect(options).toContain('Period 1: Gemara / Skills Rotation')
    expect(options).toContain('Period 4: Lunch & Recess')
    expect(options).toContain('Period 6: English Reading')
    expect(options).toContain('Breakfast')
  })

  it('validates recurrence requirements and end-time ordering', () => {
    const base = createEmptyAssignment({ id: 6, className: 'Dargei Alef' })

    const weeklyIssues = getAssignmentValidationIssues({
      ...base,
      recurrence: 'Weekly',
      day: '',
      startTime: '10:10',
      endTime: '10:55',
    })
    expect(weeklyIssues).toContain('Weekly recurrence requires a day of week.')

    const oneTimeIssues = getAssignmentValidationIssues({
      ...base,
      recurrence: 'One-time',
      day: '',
      date: '',
      startTime: '10:10',
      endTime: '10:55',
    })
    expect(oneTimeIssues).toContain('One-time recurrence requires a specific date.')

    const customIssues = getAssignmentValidationIssues({
      ...base,
      recurrence: 'Custom',
      customDays: [],
      startTime: '10:10',
      endTime: '10:55',
    })
    expect(customIssues).toContain('Custom recurrence requires at least one selected weekday.')

    const badTimeIssues = getAssignmentValidationIssues({
      ...base,
      recurrence: 'Weekly',
      day: 'Monday',
      startTime: '11:30',
      endTime: '11:00',
    })
    expect(badTimeIssues).toContain('End time must be after start time.')
  })

  it('clamps school-day time and preserves AM/PM time parts', () => {
    expect(clampToSchoolDay('22:40')).toBe('17:00')
    expect(clampToSchoolDay('06:20')).toBe('07:00')

    const parts = toTimeParts('13:25')
    expect(parts).toEqual({ hour12: '1', minute: '25', meridiem: 'PM' })
  })
})
