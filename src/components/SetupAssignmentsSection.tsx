import { useState } from 'react'

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
  filteredSetupStudents,
  togglePeriodStudent,
  toggleCaseloadStudent,
}) {
  const [pendingAssignmentChange, setPendingAssignmentChange] = useState(null)
  const [assignmentView, setAssignmentView] = useState<'staff' | 'students'>('staff')

  function getCurrentAssignmentOwner(studentId, type) {
    if (!studentId) return null

    const ownerEntries = Object.entries(setupAssignments || {}).filter(([, assignment]) => {
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
        return `${change.studentName} is currently assigned to ${currentOwner}. This will move them from ${currentOwner} to ${targetLabel} for Morning Period ${change.period}. Continue?`
      }

      return `${change.studentName} is currently assigned to ${currentOwner}. This will move them from ${currentOwner} to ${targetLabel}. Continue?`
    }

    if (change.type === 'period') {
      return `${change.action === 'add' ? 'Add' : 'Remove'} ${change.studentName} ${change.action === 'add' ? 'to' : 'from'} Morning Period ${change.period}?`
    }

    return `${change.action === 'add' ? 'Add' : 'Remove'} ${change.studentName} ${change.action === 'add' ? 'to' : 'from'} this caseload?`
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
                                        ).length,
                                      0
                                    )
                                  : (assignment.caseload || []).length

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
