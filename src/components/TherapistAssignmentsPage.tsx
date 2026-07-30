import { useMemo, useState } from 'react'
import {
  buildAssignmentConflictIndex,
  buildAffectedPeriodOptions,
  clampToSchoolDay,
  createEmptyAssignment,
  deriveStudentAssignments,
  fromTimeParts,
  getAssignmentValidationIssues,
  getAssignmentsByStudent,
  getDefaultServiceTypeForProvider,
  type AssignmentRow,
  toLegacyTherapyFields,
  toTimeParts,
} from './therapistAssignmentsUtils'

const SERVICE_TYPE_OPTIONS = [
  'OT',
  'PT',
  'Speech',
  'Counseling',
  'BCBA',
  'BT Support',
  'Therapy',
]

const RECURRENCE_OPTIONS = [
  'Weekly',
  'Twice weekly',
  'Daily',
  'Biweekly',
  'Monthly',
  'As needed',
  'One-time',
  'Custom',
]

const WEEKDAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const MINUTE_OPTIONS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
const HOURS_BY_MERIDIEM: Record<'AM' | 'PM', string[]> = {
  AM: ['7', '8', '9', '10', '11'],
  PM: ['12', '1', '2', '3', '4', '5'],
}

function toRow(assignment: AssignmentRow) {
  return {
    ...assignment,
    id: String(assignment.id),
    provider: String(assignment.provider || ''),
    serviceType: String(assignment.serviceType || ''),
    day: String(assignment.day || ''),
    date: String(assignment.date || ''),
    startTime: String(assignment.startTime || ''),
    endTime: String(assignment.endTime || ''),
    recurrence: String(assignment.recurrence || ''),
    affectedPeriod: String(assignment.affectedPeriod || ''),
    customDays: Array.isArray(assignment.customDays) ? assignment.customDays.map(value => String(value || '')) : [],
    notes: String(assignment.notes || ''),
    active: assignment.active !== false,
  }
}

function TimePicker({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  const parts = toTimeParts(value)
  const hourOptions = HOURS_BY_MERIDIEM[parts.meridiem]

  function patch(nextParts: { hour12?: string; minute?: string; meridiem?: 'AM' | 'PM' }) {
    const merged = {
      ...parts,
      ...nextParts,
    }

    const allowedHours = HOURS_BY_MERIDIEM[merged.meridiem]
    if (!allowedHours.includes(merged.hour12)) {
      merged.hour12 = allowedHours[0]
    }

    const next = fromTimeParts(merged)
    onChange(clampToSchoolDay(next))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
      <select disabled={disabled} value={parts.hour12} onChange={event => patch({ hour12: event.target.value })} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
        {hourOptions.map(hour => (
          <option key={hour} value={hour}>{hour}</option>
        ))}
      </select>
      <select disabled={disabled} value={parts.minute} onChange={event => patch({ minute: event.target.value })} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
        {MINUTE_OPTIONS.map(minute => (
          <option key={minute} value={minute}>{minute}</option>
        ))}
      </select>
      <select disabled={disabled} value={parts.meridiem} onChange={event => patch({ meridiem: event.target.value === 'PM' ? 'PM' : 'AM' })} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

export default function TherapistAssignmentsPage({ S, students, setStudents, THERAPIST_OPTIONS, SCHEDULE_PERIODS }: any) {
  const [editingByAssignmentId, setEditingByAssignmentId] = useState<Record<string, boolean>>({})

  const byStudent = useMemo(() => getAssignmentsByStudent(students), [students])
  const allAssignments = useMemo(() => {
    const rows: Array<{ studentId: number | string; studentName: string; assignment: AssignmentRow }> = []
    students.forEach((student: any) => {
      deriveStudentAssignments(student).forEach((assignment: AssignmentRow) => {
        rows.push({ studentId: student.id, studentName: student.name, assignment: toRow(assignment) })
      })
    })
    return rows
  }, [students])

  const conflicts = useMemo(() => buildAssignmentConflictIndex(allAssignments), [allAssignments])

  const providerLoad = useMemo(() => {
    const map: Record<string, number> = {}
    allAssignments.forEach(({ assignment }) => {
      if (!assignment.active || !assignment.provider) return
      map[assignment.provider] = (map[assignment.provider] || 0) + 1
    })
    return map
  }, [allAssignments])

  const periodOptionsByStudentId = useMemo(() => {
    return students.reduce((acc: Record<string, string[]>, student: any) => {
      acc[String(student.id)] = buildAffectedPeriodOptions(student, SCHEDULE_PERIODS)
      return acc
    }, {})
  }, [students, SCHEDULE_PERIODS])

  function patchStudent(studentId: number | string, updater: (assignments: AssignmentRow[]) => AssignmentRow[]) {
    setStudents((prev: any[]) => prev.map(student => {
      if (student.id !== studentId) return student

      const nextAssignments = updater(deriveStudentAssignments(student).map(toRow))
      const legacy = toLegacyTherapyFields(nextAssignments)

      return {
        ...student,
        therapyAssignments: nextAssignments,
        ...legacy,
      }
    }))
  }

  function setEditing(assignmentId: string, editing: boolean) {
    setEditingByAssignmentId(prev => ({ ...prev, [assignmentId]: editing }))
  }

  function patchAssignment(studentId: number | string, assignmentId: string, updater: (assignment: AssignmentRow) => AssignmentRow) {
    patchStudent(studentId, prev => prev.map(row => row.id === assignmentId ? updater(row) : row))
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#172033' }}>Therapist Assignments</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Each student can hold multiple active provider and service assignments at the same time.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {THERAPIST_OPTIONS.map((t: any) => (
              <span key={t.name} style={{ padding: '8px 12px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 800, color: '#334155' }}>
                {t.name}: {providerLoad[t.name] || 0}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'grid', gap: 12 }}>
          {students.map((student: any) => {
            const assignments = byStudent[String(student.id)] || []
            const studentWarnings = conflicts.studentWarningsByStudentId[String(student.id)] || []

            return (
              <div key={student.id} style={{ border: '1px solid #dbe5f0', borderRadius: 12, background: '#fff', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>{student.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{student.className || 'Unassigned class'}</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = createEmptyAssignment(student)
                      patchStudent(student.id, prev => [...prev, toRow(next as AssignmentRow)])
                      setEditing(String(next.id), true)
                    }}
                    style={S.btn('ghost')}
                  >
                    + Add another provider/service
                  </button>
                </div>

                {studentWarnings.length > 0 && (
                  <div style={{ border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, marginBottom: 10 }}>
                    {studentWarnings.map((warning: string, index: number) => (
                      <div key={`${student.id}-warning-${index}`}>Student conflict: {warning}</div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gap: 8 }}>
                  {assignments.length === 0 && (
                    <div style={{ border: '1px dashed #dbe5f0', borderRadius: 8, padding: '10px 12px', color: '#64748b', fontSize: 12 }}>
                      No assignments yet.
                    </div>
                  )}

                  {assignments.map((assignment: AssignmentRow) => {
                    const isEditing = !!editingByAssignmentId[assignment.id]
                    const providerWarnings = conflicts.providerWarningsByAssignmentId[String(assignment.id)] || []
                    const validationIssues = getAssignmentValidationIssues(assignment)
                    const periodOptions = periodOptionsByStudentId[String(student.id)] || []
                    const recurrenceValue = String(assignment.recurrence || '')
                    const isOneTime = recurrenceValue === 'One-time'
                    const isCustom = recurrenceValue === 'Custom'

                    return (
                      <div key={assignment.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, background: assignment.active ? '#ffffff' : '#f8fafc', opacity: assignment.active ? 1 : 0.72 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>{assignment.serviceType || 'Service'}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{assignment.provider || 'No provider'}</span>
                            <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 999, border: '1px solid #dbe5f0', color: assignment.active ? '#166534' : '#64748b', background: assignment.active ? '#ecfdf3' : '#f1f5f9' }}>
                              {assignment.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setEditing(assignment.id, !isEditing)} style={S.btn('ghost')}>
                              {isEditing ? 'Done Editing' : 'Edit Assignment'}
                            </button>
                            <button
                              onClick={() => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, active: !row.active } : row))}
                              style={S.btn('ghost')}
                            >
                              {assignment.active ? 'Archive' : 'Activate'}
                            </button>
                            <button
                              onClick={() => patchStudent(student.id, prev => prev.filter(row => row.id !== assignment.id))}
                              style={S.btn('danger')}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {providerWarnings.length > 0 && (
                          <div style={{ border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, marginBottom: 8 }}>
                            {providerWarnings.map((warning: string, index: number) => (
                              <div key={`${assignment.id}-provider-warning-${index}`}>Provider conflict: {warning}</div>
                            ))}
                          </div>
                        )}

                        {validationIssues.length > 0 && (
                          <div style={{ border: '1px solid #ef4444', background: '#fef2f2', color: '#991b1b', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, marginBottom: 8 }}>
                            {validationIssues.map((issue: string, index: number) => (
                              <div key={`${assignment.id}-validation-${index}`}>{issue}</div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: 8 }}>
                          <select disabled={!isEditing} value={assignment.provider} onChange={event => {
                            const nextProvider = event.target.value
                            patchAssignment(student.id, assignment.id, row => {
                              const previousDefault = getDefaultServiceTypeForProvider(row.provider, THERAPIST_OPTIONS)
                              const nextDefault = getDefaultServiceTypeForProvider(nextProvider, THERAPIST_OPTIONS)
                              const shouldAutoApplyDefault = !row.serviceType || row.serviceType === previousDefault
                              return {
                                ...row,
                                provider: nextProvider,
                                serviceType: shouldAutoApplyDefault && nextDefault ? nextDefault : row.serviceType,
                              }
                            })
                          }} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Select provider</option>
                            {THERAPIST_OPTIONS.map((option: any) => (
                              <option key={option.name} value={option.name}>{option.name}</option>
                            ))}
                          </select>

                          <select disabled={!isEditing} value={assignment.serviceType} onChange={event => patchAssignment(student.id, assignment.id, row => ({ ...row, serviceType: event.target.value }))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Service type</option>
                            {SERVICE_TYPE_OPTIONS.map(value => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>

                          <select disabled={!isEditing || isOneTime || isCustom} value={assignment.day} onChange={event => patchAssignment(student.id, assignment.id, row => ({ ...row, day: event.target.value }))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Day</option>
                            {WEEKDAY_OPTIONS.map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>

                          <input disabled={!isEditing} type="date" value={assignment.date} onChange={event => patchAssignment(student.id, assignment.id, row => ({ ...row, date: event.target.value }))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }} />

                          <TimePicker
                            disabled={!isEditing}
                            value={assignment.startTime}
                            onChange={nextValue => patchAssignment(student.id, assignment.id, row => ({ ...row, startTime: nextValue }))}
                          />

                          <TimePicker
                            disabled={!isEditing}
                            value={assignment.endTime}
                            onChange={nextValue => patchAssignment(student.id, assignment.id, row => ({ ...row, endTime: nextValue }))}
                          />

                          <select disabled={!isEditing} value={assignment.recurrence} onChange={event => {
                            const nextRecurrence = event.target.value
                            patchAssignment(student.id, assignment.id, row => {
                              if (nextRecurrence === 'One-time') {
                                return { ...row, recurrence: nextRecurrence, day: '', customDays: [] }
                              }

                              if (nextRecurrence === 'Custom') {
                                const nextCustomDays = Array.isArray(row.customDays) && row.customDays.length > 0
                                  ? row.customDays
                                  : (row.day ? [row.day] : [])
                                return { ...row, recurrence: nextRecurrence, day: '', customDays: nextCustomDays }
                              }

                              return {
                                ...row,
                                recurrence: nextRecurrence,
                                day: row.day || (nextRecurrence === 'Weekly' ? 'Monday' : row.day),
                                customDays: [],
                              }
                            })
                          }} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Recurrence</option>
                            {RECURRENCE_OPTIONS.map(value => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>

                          <select disabled={!isEditing} value={assignment.affectedPeriod} onChange={event => patchAssignment(student.id, assignment.id, row => ({ ...row, affectedPeriod: event.target.value }))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Affected class/period</option>
                            {periodOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>

                        {isCustom && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {WEEKDAY_OPTIONS.map(day => {
                              const selected = Array.isArray(assignment.customDays) && assignment.customDays.includes(day)
                              return (
                                <button
                                  key={`${assignment.id}-custom-day-${day}`}
                                  disabled={!isEditing}
                                  onClick={() => patchAssignment(student.id, assignment.id, row => {
                                    const existing = Array.isArray(row.customDays) ? row.customDays : []
                                    const next = existing.includes(day)
                                      ? existing.filter(value => value !== day)
                                      : [...existing, day]
                                    return {
                                      ...row,
                                      customDays: next,
                                    }
                                  })}
                                  style={{
                                    ...S.btn('ghost'),
                                    border: selected ? '1px solid #172033' : '1px solid #dbe5f0',
                                    background: selected ? '#e2e8f0' : '#ffffff',
                                  }}
                                >
                                  {day}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
                          {isOneTime ? 'One-time sessions require a specific date.' : 'Date is optional for recurring sessions and can be used as the start date.'}
                        </div>

                        <textarea disabled={!isEditing} value={assignment.notes} onChange={event => patchAssignment(student.id, assignment.id, row => ({ ...row, notes: event.target.value }))} placeholder="Notes" style={{ marginTop: 8, width: '100%', minHeight: 56, padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
