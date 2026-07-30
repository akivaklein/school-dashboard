import { describe, expect, it } from 'vitest'
import {
  buildAssignmentConflictIndex,
  deriveStudentAssignments,
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
})
