import { useMemo, useState } from 'react'

export default function SetupAssignmentsSection({
  overlapWarnings,
  S,
  setupPersonSearch,
  setSetupPersonSearch,
  visiblePeople,
  currentPerson,
  setupAssignments,
  emptyAssignment,
  setSetupPerson,
  setupStudentSearch,
  setSetupStudentSearch,
  currentAssignment,
  copyPeriodOneToTwo,
  activeStudents = [],
  filteredSetupStudents,
  togglePeriodStudent,
  toggleCaseloadStudent,
  teacherRebbeAssignments = [],
  onSaveTeacherRebbeAssignment,
  onSetTeacherRebbeAssignmentStatus,
}) {
  const [pendingAssignmentChange, setPendingAssignmentChange] = useState(null)
  const [assignmentView, setAssignmentView] = useState<'staff' | 'students'>('staff')
  const [bulkPeriodBusy, setBulkPeriodBusy] = useState<number | null>(null)
  const [teacherDraft, setTeacherDraft] = useState({
    studentId: '',
    subject: '',
    classOrGroup: '',
    period: 'Period 1',
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startDate: '',
    endDate: '',
    assignmentType: 'additional',
    status: 'active',
  })

  const currentTeacherAssignments = useMemo(() => {
    if (!currentPerson?.name) return []
    return (teacherRebbeAssignments || []).filter(assignment => (
      assignment.teacher_name === currentPerson.name &&
      activeStudents.some(student => Number(student.id) === Number(assignment.student_id))
    ))
  }, [teacherRebbeAssignments, currentPerson?.name, activeStudents])

  function toggleDraftWeekday(day) {
    setTeacherDraft(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(value => value !== day)
        : [...prev.weekdays, day],
    }))
  }

  async function saveTeacherDraftAssignment() {
    if (typeof onSaveTeacherRebbeAssignment !== 'function') return
    const studentId = Number(teacherDraft.studentId)
    if (!Number.isFinite(studentId) || !currentPerson?.name) return

    await onSaveTeacherRebbeAssignment({
      student_id: studentId,
      teacher_name: currentPerson.name,
      subject: teacherDraft.subject || 'General',
      class_or_group: teacherDraft.classOrGroup || 'General Group',
      period: teacherDraft.period,
      weekdays: teacherDraft.weekdays,
      start_date: teacherDraft.startDate || null,
      end_date: teacherDraft.endDate || null,
      assignment_type: teacherDraft.assignmentType,
      status: teacherDraft.status,
    })

    setTeacherDraft(prev => ({
      ...prev,
      studentId: '',
      subject: '',
      classOrGroup: '',
      startDate: '',
      endDate: '',
    }))
  }

  function getCurrentAssignmentOwner(studentId, type) {
    if (!studentId) return null

    const assignmentEntries = Object.entries(
      (setupAssignments || {}) as Record<string, { periods?: Record<number, Array<number | string>>; caseload?: Array<number | string> } | null>,
    )

    const ownerEntries = assignmentEntries.filter(([, assignment]) => {
      if (!assignment) return false

      if (type === 'period') {
        return [1, 2, 3].some(period => (assignment.periods?.[period] || []).includes(Number(studentId)))
      }

      return (assignment.caseload || []).includes(Number(studentId))
    })

    const [ownerName] = ownerEntries[0] || []
    return ownerName || null
  }

  function getAssignmentConfirmationText(change) {
    if (!change) return ''

    const currentOwner = getCurrentAssignmentOwner(change.studentId, change.type === 'period' ? 'period' : 'caseload')
    const isReassigning = change.action === 'add' && currentOwner && currentOwner !== currentPerson?.name
    const targetLabel = currentPerson?.name || 'this staff member'

    if (isReassigning) {
      if (change.type === 'period') {
        return `is currently assigned to ${currentOwner}. This will move them to ${targetLabel} for Morning Period ${change.period}.`
      }

      return `is currently assigned to ${currentOwner}. This will reassign them to ${targetLabel}.`
    }

    if (change.type === 'period') {
      return `will be ${change.action === 'add' ? 'added to' : 'removed from'} Morning Period ${change.period}.`
    }

    return `will be ${change.action === 'add' ? 'added to' : 'removed from'} this caseload.`
  }

  async function confirmAssignmentChange() {
    if (!pendingAssignmentChange) return

    if (pendingAssignmentChange.type === 'period') {
      await togglePeriodStudent(
        pendingAssignmentChange.period,
        pendingAssignmentChange.studentId
      )
    } else {
      await toggleCaseloadStudent(pendingAssignmentChange.studentId)
    }

    setPendingAssignmentChange(null)
  }

  async function applyBulkPeriodChange(period, action: 'assign' | 'clear') {
    if (bulkPeriodBusy !== null) return

    const selectedIds = new Set(
      (currentAssignment.periods?.[period] || []).map((id: number | string) => Number(id))
    )

    const targetStudents = filteredSetupStudents.filter(student => {
      const numericId = Number(student.id)
      if (!Number.isFinite(numericId)) return false

      if (action === 'assign') {
        return !selectedIds.has(numericId)
      }

      return selectedIds.has(numericId)
    })

    if (targetStudents.length === 0) return

    setBulkPeriodBusy(period)
    try {
      for (const student of targetStudents) {
        await togglePeriodStudent(period, student.id)
      }
    } finally {
      setBulkPeriodBusy(null)
    }
  }

  return (
                    <>
                      {pendingAssignmentChange && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
                            <div style={{ background: '#0f172a', padding: '14px 18px', color: '#fff' }}>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>Confirm Assignment Change</div>
                              <div style={{ fontSize: 12, opacity: 0.82, marginTop: 3 }}>Please confirm before saving roster updates.</div>
                            </div>
                            <div style={{ padding: 18 }}>
                              <div style={{ fontSize: 14, color: '#334155', marginBottom: 16 }}>
                                <b>{pendingAssignmentChange.studentName}</b>{' '}
                                {getAssignmentConfirmationText(pendingAssignmentChange)}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setPendingAssignmentChange(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                                <button onClick={confirmAssignmentChange} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {overlapWarnings.length > 0 && (
                        <div style={{
                          border: '1px solid #e4c5a3',
                          background: '#fff9f1',
                          borderRadius: 14,
                          padding: 16,
                          marginBottom: 16
                        }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: '#8a5a24',
                            marginBottom: 8
                          }}>
                            Assignment Overlaps ({overlapWarnings.length})
                          </div>

                          {overlapWarnings.map((warning, index) => (
                            <div
                              key={`${warning.period}-${warning.studentName}-${index}`}
                              style={{
                                padding: '7px 0',
                                borderBottom:
                                  index === overlapWarnings.length - 1
                                    ? 'none'
                                    : '1px solid #f0dfca',
                                fontSize: 12,
                                color: '#745334'
                              }}
                            >
                              <b>{warning.studentName}</b> is assigned to{' '}
                              {warning.teacherNames.join(' and ')} during
                              Period {warning.period}.
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ ...S.card, marginBottom: 12, padding: '12px 14px', border: '1px solid #d9e3ee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#102a43' }}>Assignments</div>
                            <div style={{ fontSize: 12, color: '#52667e', marginTop: 3 }}>Assign students by staff roster or student roster view.</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button onClick={() => setAssignmentView('staff')} style={assignmentView === 'staff' ? S.btn('primary') : S.btn('ghost')}>Staff View</button>
                            <button onClick={() => setAssignmentView('students')} style={assignmentView === 'students' ? S.btn('primary') : S.btn('ghost')}>Student View</button>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: assignmentView === 'students' ? 'minmax(0, 1fr)' : 'minmax(320px, 360px) minmax(0, 1fr)',
                        gap: 22,
                        alignItems: 'start'
                      }}>
                        {assignmentView === 'staff' && (
                        <div style={{
                          ...S.card,
                          padding: 16,
                          position: 'sticky',
                          top: 18
                        }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: '#223046',
                            marginBottom: 10
                          }}>
                            Teachers, Therapists & BCBAs
                          </div>

                          <input
                            value={setupPersonSearch}
                            onChange={event =>
                              setSetupPersonSearch(event.target.value)
                            }
                            placeholder="Search staff..."
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '9px 10px',
                              border: '1px solid #dce4ed',
                              borderRadius: 9,
                              marginBottom: 10,
                              fontSize: 12
                            }}
                            spellCheck
                            lang="en"
                          />

                          <div style={{
                              maxHeight: '70vh',
                            overflowY: 'auto',
                            display: 'grid',
                            gap: 6
                          }}>
                            {visiblePeople.map(person => {
                              const isActive =
                                person.name === currentPerson?.name

                              const assignment =
                                setupAssignments[person.name] ||
                                emptyAssignment

                              const assignmentCount =
                                person.type === 'teacher'
                                  ? [1, 2, 3].reduce(
                                      (sum, period) =>
                                        sum +
                                        (
                                          assignment.periods?.[period] ||
                                          []
                                        ).filter(studentId =>
                                          activeStudents.some(student => Number(student.id) === Number(studentId))
                                        ).length,
                                      0
                                    )
                                  : (assignment.caseload || []).filter(studentId =>
                                      activeStudents.some(student => Number(student.id) === Number(studentId))
                                    ).length

                              return (
                                <button
                                  key={`${person.type}-${person.name}`}
                                  onClick={() =>
                                    setSetupPerson(person.name)
                                  }
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: `1px solid ${
                                      isActive
                                        ? '#7e9dbf'
                                        : '#e1e7ef'
                                    }`,
                                    background:
                                      isActive
                                        ? '#edf4fb'
                                        : '#ffffff',
                                    borderRadius: 10,
                                    padding: '10px 11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 8
                                  }}>
                                    <span style={{
                                      fontSize: 12,
                                      fontWeight: 900,
                                      color: '#27384e'
                                    }}>
                                      {person.name}
                                    </span>

                                    <span style={{
                                      fontSize: 10,
                                      color: '#738197'
                                    }}>
                                      {assignmentCount}
                                    </span>
                                  </div>

                                  <div style={{
                                    fontSize: 10.5,
                                    color: '#738197',
                                    marginTop: 3
                                  }}>
                                    {person.specialty}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        )}

                        <div style={{ ...S.card, padding: 20 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 16,
                            flexWrap: 'wrap'
                          }}>
                            <div>
                              <div style={{
                                fontSize: 20,
                                fontWeight: 900,
                                color: '#223046'
                              }}>
                                {currentPerson?.name}
                              </div>

                              <div style={{
                                fontSize: 12,
                                color: '#718096',
                                marginTop: 3
                              }}>
                                {currentPerson?.specialty}
                              </div>
                            </div>

                            <input
                              value={setupStudentSearch}
                              onChange={event =>
                                setSetupStudentSearch(event.target.value)
                              }
                              placeholder="Search students..."
                              style={{
                                width: 'min(100%, 240px)',
                                padding: '9px 11px',
                                border: '1px solid #dce4ed',
                                borderRadius: 9,
                                fontSize: 12
                              }}
                              spellCheck
                              lang="en"
                            />
                          </div>

                          {filteredSetupStudents.length === 0 && (
                            <div style={{
                              marginTop: 14,
                              padding: 14,
                              border: '1px solid #dce4ed',
                              borderRadius: 10,
                              background: '#f8fafc',
                              color: '#52667e',
                              fontSize: 12,
                            }}>
                              No active students are available for assignment. Add a student from the Students page first.
                            </div>
                          )}

                          {currentPerson?.type === 'teacher' ? (
                            <div style={{
                              display: 'grid',
                              gap: 14
                            }}>
                              {[1, 2, 3].map(period => {
                                const selectedIds =
                                  currentAssignment.periods?.[period] || []

                                return (
                                  <div
                                    key={period}
                                    style={{
                                      border: '1px solid #e0e7ef',
                                      borderRadius: 14,
                                      overflow: 'hidden',
                                      background: '#fbfcfe'
                                    }}
                                  >
                                    <div style={{
                                      padding: '11px 13px',
                                      borderBottom: '1px solid #e5ebf2',
                                      background: '#f4f7fb',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 10
                                    }}>
                                      <div>
                                        <div style={{
                                          fontSize: 13,
                                          fontWeight: 900,
                                          color: '#2a3c53'
                                        }}>
                                          Morning Period {period}
                                        </div>

                                        <div style={{
                                          fontSize: 10.5,
                                          color: '#748297',
                                          marginTop: 2
                                        }}>
                                          {selectedIds.length} students assigned
                                        </div>
                                      </div>

                                      {period === 2 && (
                                        <button
                                          onClick={copyPeriodOneToTwo}
                                          style={S.btn('ghost')}
                                        >
                                          Copy Period 1
                                        </button>
                                      )}

                                      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                                        <button
                                          onClick={() => applyBulkPeriodChange(period, 'assign')}
                                          disabled={bulkPeriodBusy !== null}
                                          style={{ ...S.btn('ghost'), padding: '5px 8px', fontSize: 10.5 }}
                                        >
                                          {bulkPeriodBusy === period ? 'Applying...' : 'Assign Filtered'}
                                        </button>
                                        <button
                                          onClick={() => applyBulkPeriodChange(period, 'clear')}
                                          disabled={bulkPeriodBusy !== null}
                                          style={{ ...S.btn('ghost'), padding: '5px 8px', fontSize: 10.5 }}
                                        >
                                          Clear Filtered
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{
                                      padding: 12,
                                      display: 'grid',
                                      gridTemplateColumns:
                                        'repeat(auto-fill, minmax(210px, 1fr))',
                                      gap: 7,
                                      maxHeight: 250,
                                      overflowY: 'auto'
                                    }}>
                                      {filteredSetupStudents.map(student => {
                                        const selected =
                                          selectedIds.includes(student.id)

                                        return (
                                          <button
                                            key={`${period}-${student.id}`}
                                            onClick={() =>
                                              setPendingAssignmentChange({
                                                type: 'period',
                                                period,
                                                studentId: student.id,
                                                studentName: student.name,
                                                action: selected ? 'remove' : 'add',
                                              })
                                            }
                                            style={{
                                              textAlign: 'left',
                                              padding: '8px 9px',
                                              borderRadius: 9,
                                              border: `1px solid ${
                                                selected
                                                  ? '#7c9d84'
                                                  : '#dde4ec'
                                              }`,
                                              background:
                                                selected
                                                  ? '#edf6ef'
                                                  : '#ffffff',
                                              color:
                                                selected
                                                  ? '#365a40'
                                                  : '#566579',
                                              fontSize: 11,
                                              fontWeight:
                                                selected ? 900 : 600,
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {selected ? '✓ ' : ''}
                                            {student.name}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}

                              <div style={{ border: '1px solid #dbe5f0', borderRadius: 12, background: '#ffffff', padding: 12 }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: '#2a3c53', marginBottom: 4 }}>Teacher/Rebbe Assignment Records</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                                  These records drive teacher access scope and allow multiple assignments per student.
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
                                  <select value={teacherDraft.studentId} onChange={event => setTeacherDraft(prev => ({ ...prev, studentId: event.target.value }))} style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #dbe5f0', fontSize: 11 }}>
                                    <option value="">Student</option>
                                    {filteredSetupStudents.map(student => <option key={`teacher-draft-student-${student.id}`} value={student.id}>{student.name}</option>)}
                                  </select>
                                  <input value={teacherDraft.subject} onChange={event => setTeacherDraft(prev => ({ ...prev, subject: event.target.value }))} placeholder="Subject" style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #dbe5f0', fontSize: 11 }} />
                                  <input value={teacherDraft.classOrGroup} onChange={event => setTeacherDraft(prev => ({ ...prev, classOrGroup: event.target.value }))} placeholder="Class or group" style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #dbe5f0', fontSize: 11 }} />
                                  <select value={teacherDraft.period} onChange={event => setTeacherDraft(prev => ({ ...prev, period: event.target.value }))} style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #dbe5f0', fontSize: 11 }}>
                                    <option value="Period 1">Period 1</option>
                                    <option value="Period 2">Period 2</option>
                                    <option value="Period 3">Period 3</option>
                                    <option value="Advisory">Advisory</option>
                                    <option value="Pullout">Pullout</option>
                                  </select>
                                  <select value={teacherDraft.assignmentType} onChange={event => setTeacherDraft(prev => ({ ...prev, assignmentType: event.target.value }))} style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #dbe5f0', fontSize: 11 }}>
                                    <option value="primary">Primary</option>
                                    <option value="additional">Additional</option>
                                  </select>
                                  <select value={teacherDraft.status} onChange={event => setTeacherDraft(prev => ({ ...prev, status: event.target.value }))} style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #dbe5f0', fontSize: 11 }}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </select>
                                  <input type="date" value={teacherDraft.startDate} onChange={event => setTeacherDraft(prev => ({ ...prev, startDate: event.target.value }))} style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #dbe5f0', fontSize: 11 }} />
                                  <input type="date" value={teacherDraft.endDate} onChange={event => setTeacherDraft(prev => ({ ...prev, endDate: event.target.value }))} style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #dbe5f0', fontSize: 11 }} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                    const selected = teacherDraft.weekdays.includes(day)
                                    return (
                                      <button
                                        key={`weekday-${day}`}
                                        onClick={() => toggleDraftWeekday(day)}
                                        style={{
                                          ...S.btn('ghost'),
                                          padding: '4px 8px',
                                          fontSize: 10.5,
                                          border: selected ? '1px solid #7c9d84' : '1px solid #dbe5f0',
                                          background: selected ? '#edf6ef' : '#ffffff',
                                        }}
                                      >
                                        {day.slice(0, 3)}
                                      </button>
                                    )
                                  })}
                                  <button onClick={saveTeacherDraftAssignment} style={{ ...S.btn('primary'), marginLeft: 'auto' }}>Save Assignment</button>
                                </div>

                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(95px, 0.7fr) minmax(95px, 0.8fr) minmax(90px, 0.8fr) minmax(90px, 0.8fr) auto', gap: 8, padding: '7px 9px', background: '#f8fafc', fontSize: 10.5, fontWeight: 800, color: '#475569' }}>
                                    <div>Student / Subject</div>
                                    <div>Class/Group</div>
                                    <div>Period</div>
                                    <div>Type</div>
                                    <div>Status</div>
                                    <div>Action</div>
                                  </div>
                                  {currentTeacherAssignments.length === 0 && (
                                    <div style={{ padding: '10px 9px', fontSize: 11, color: '#64748b' }}>No teacher/rebbe assignments saved yet.</div>
                                  )}
                                  {currentTeacherAssignments.map(assignment => {
                                    const studentName = activeStudents.find(student => Number(student.id) === Number(assignment.student_id))?.name || `Student ${assignment.student_id}`
                                    return (
                                      <div key={assignment.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(95px, 0.7fr) minmax(95px, 0.8fr) minmax(90px, 0.8fr) minmax(90px, 0.8fr) auto', gap: 8, padding: '8px 9px', borderTop: '1px solid #edf2f7', fontSize: 11, alignItems: 'center' }}>
                                        <div><div style={{ fontWeight: 700 }}>{studentName}</div><div style={{ color: '#64748b' }}>{assignment.subject || 'General'}</div></div>
                                        <div>{assignment.class_or_group || '—'}</div>
                                        <div>{assignment.period || '—'}</div>
                                        <div style={{ textTransform: 'capitalize' }}>{assignment.assignment_type || 'additional'}</div>
                                        <div style={{ textTransform: 'capitalize' }}>{assignment.status || 'active'}</div>
                                        <button
                                          onClick={() => onSetTeacherRebbeAssignmentStatus?.(assignment.id, assignment.status === 'active' ? 'inactive' : 'active')}
                                          style={{ ...S.btn('ghost'), padding: '4px 7px', fontSize: 10.5 }}
                                        >
                                          {assignment.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{
                                border: '1px solid #e0e7ef',
                                borderRadius: 14,
                                background: '#fbfcfe',
                                padding: 13
                              }}>
                                <div style={{
                                  fontSize: 13,
                                  fontWeight: 900,
                                  color: '#2a3c53',
                                  marginBottom: 3
                                }}>
                                  Assigned Caseload
                                </div>

                                <div style={{
                                  fontSize: 11,
                                  color: '#748297',
                                  marginBottom: 12
                                }}>
                                  {(currentAssignment.caseload || []).length}
                                  {' '}boys assigned · click a student to add
                                  or remove him
                                </div>

                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns:
                                    'repeat(auto-fill, minmax(220px, 1fr))',
                                  gap: 7,
                                  maxHeight: '62vh',
                                  overflowY: 'auto'
                                }}>
                                  {filteredSetupStudents.map(student => {
                                    const selected =
                                      (
                                        currentAssignment.caseload || []
                                      ).includes(student.id)

                                    return (
                                      <button
                                        key={student.id}
                                        onClick={() =>
                                          setPendingAssignmentChange({
                                            type: 'caseload',
                                            studentId: student.id,
                                            studentName: student.name,
                                            action: selected ? 'remove' : 'add',
                                          })
                                        }
                                        style={{
                                          textAlign: 'left',
                                          padding: '9px 10px',
                                          borderRadius: 9,
                                          border: `1px solid ${
                                            selected
                                              ? '#7b9bbd'
                                              : '#dde4ec'
                                          }`,
                                          background:
                                            selected
                                              ? '#edf4fb'
                                              : '#ffffff',
                                          color:
                                            selected
                                              ? '#31516f'
                                              : '#566579',
                                          fontSize: 11,
                                          fontWeight:
                                            selected ? 900 : 600,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {selected ? '✓ ' : ''}
                                        {student.name}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
  )
}
