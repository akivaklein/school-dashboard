import { useMemo, useState } from 'react'
import {
  buildAssignmentConflictIndex,
  createEmptyAssignment,
  deriveStudentAssignments,
  getAssignmentsByStudent,
  toLegacyTherapyFields,
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
]

type AssignmentRow = {
  id: string
  provider: string
  serviceType: string
  day: string
  date: string
  startTime: string
  endTime: string
  recurrence: string
  affectedPeriod: string
  notes: string
  active: boolean
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
    notes: String(assignment.notes || ''),
    active: assignment.active !== false,
  }
}

export default function TherapistAssignmentsPage({ S, students, setStudents, THERAPIST_OPTIONS }: any) {
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

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 8 }}>
                          <select disabled={!isEditing} value={assignment.provider} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, provider: event.target.value } : row))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Select provider</option>
                            {THERAPIST_OPTIONS.map((option: any) => (
                              <option key={option.name} value={option.name}>{option.name}</option>
                            ))}
                          </select>

                          <select disabled={!isEditing} value={assignment.serviceType} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, serviceType: event.target.value } : row))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Service type</option>
                            {SERVICE_TYPE_OPTIONS.map(value => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>

                          <select disabled={!isEditing} value={assignment.day} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, day: event.target.value } : row))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Day</option>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>

                          <input disabled={!isEditing} type="date" value={assignment.date} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, date: event.target.value } : row))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }} />

                          <input disabled={!isEditing} type="time" value={assignment.startTime} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, startTime: event.target.value } : row))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }} />
                          <input disabled={!isEditing} type="time" value={assignment.endTime} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, endTime: event.target.value } : row))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }} />

                          <select disabled={!isEditing} value={assignment.recurrence} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, recurrence: event.target.value } : row))} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                            <option value="">Recurrence</option>
                            {RECURRENCE_OPTIONS.map(value => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>

                          <input disabled={!isEditing} value={assignment.affectedPeriod} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, affectedPeriod: event.target.value } : row))} placeholder="Affected class/period" style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }} />
                        </div>

                        <textarea disabled={!isEditing} value={assignment.notes} onChange={event => patchStudent(student.id, prev => prev.map(row => row.id === assignment.id ? { ...row, notes: event.target.value } : row))} placeholder="Notes" style={{ marginTop: 8, width: '100%', minHeight: 56, padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
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
