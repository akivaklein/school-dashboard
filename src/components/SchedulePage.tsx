import { useEffect, useMemo, useState } from 'react'
import { isInClassroom } from '../utils/attendancePresence'
import { buildClassroomCoverageSnapshot } from './dashboardData'

type Props = {
  S: any
  students: any[]
  STAFF: any[]
  SCHEDULE_PERIODS: any[]
  THERAPY_SCHEDULE: any[]
  openStudent: (student: any, tab?: string) => void
  initials: (name: string) => string
  statusColor: Record<string, string>
  statusEmoji: Record<string, string>
  statusLabel: Record<string, string>
  CLASSES?: Array<{ id: string; name: string }>
}

export default function SchedulePage({
  S,
  students,
  STAFF,
  SCHEDULE_PERIODS,
  THERAPY_SCHEDULE,
  openStudent,
  initials,
  statusColor,
  statusEmoji,
  statusLabel,
  CLASSES = [],
}: Props) {
  const [horizonDays, setHorizonDays] = useState(3)
  const [selectedCoverageClassId, setSelectedCoverageClassId] = useState<string | null>(CLASSES[0]?.id || null)
  const [showConflicts, setShowConflicts] = useState(false)
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({})
  const [compactTherapyRows, setCompactTherapyRows] = useState(true)
  const [compactCoverageRows, setCompactCoverageRows] = useState(true)

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const jsDayToName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = jsDayToName[new Date().getDay()]

  const planningWindowLabel = horizonDays === 1 ? 'Today' : horizonDays === 3 ? 'Next 3 Days' : 'Next 5 Days'

  const orderedSchoolDays = useMemo(() => {
    const startIndex = dayOrder.indexOf(todayName)
    if (startIndex === -1) return dayOrder
    return [...dayOrder.slice(startIndex), ...dayOrder.slice(0, startIndex)]
  }, [todayName])

  const visibleDays = orderedSchoolDays.slice(0, Math.max(1, Math.min(5, horizonDays)))
  const visibleDaySet = new Set(visibleDays)

  const therapyRows = useMemo(
    () => (THERAPY_SCHEDULE || []).filter(item => visibleDaySet.has(String(item.day || ''))),
    [THERAPY_SCHEDULE, visibleDaySet],
  )

  const toMinutes = (timeValue: string) => {
    const match = String(timeValue || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return Number.MAX_SAFE_INTEGER
    let hour = Number(match[1])
    const minute = Number(match[2])
    const meridiem = String(match[3]).toUpperCase()
    if (meridiem === 'PM' && hour !== 12) hour += 12
    if (meridiem === 'AM' && hour === 12) hour = 0
    return hour * 60 + minute
  }

  const nextSessionByStudentName = useMemo(() => {
    const rows = Array.isArray(THERAPY_SCHEDULE) ? THERAPY_SCHEDULE : []
    const sorted = [...rows].sort((a, b) => {
      const dayA = orderedSchoolDays.indexOf(String(a.day || ''))
      const dayB = orderedSchoolDays.indexOf(String(b.day || ''))
      const safeDayA = dayA === -1 ? Number.MAX_SAFE_INTEGER : dayA
      const safeDayB = dayB === -1 ? Number.MAX_SAFE_INTEGER : dayB
      if (safeDayA !== safeDayB) return safeDayA - safeDayB
      return toMinutes(String(a.time || '')) - toMinutes(String(b.time || ''))
    })

    const map = new Map<string, { day: string; time: string; type: string }>()
    sorted.forEach(row => {
      const studentName = String(row.student || '').trim().toLowerCase()
      if (!studentName || map.has(studentName)) return
      map.set(studentName, {
        day: String(row.day || '').trim(),
        time: String(row.time || '').trim(),
        type: String(row.type || row.service || 'Service').trim(),
      })
    })

    return map
  }, [THERAPY_SCHEDULE, orderedSchoolDays])

  const therapyProviders = useMemo(() => {
    const toMinutes = (timeValue: string) => {
      const match = String(timeValue || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      if (!match) return Number.MAX_SAFE_INTEGER
      let hour = Number(match[1])
      const minute = Number(match[2])
      const meridiem = String(match[3]).toUpperCase()
      if (meridiem === 'PM' && hour !== 12) hour += 12
      if (meridiem === 'AM' && hour === 12) hour = 0
      return hour * 60 + minute
    }

    const groups = new Map<string, any[]>()
    therapyRows.forEach(row => {
      const provider = String(row.therapistName || row.staffName || row.staffId || 'Unassigned Provider')
      const existing = groups.get(provider) || []
      groups.set(provider, [...existing, row])
    })

    return Array.from(groups.entries())
      .map(([provider, rows]) => {
        const sortedRows = [...rows].sort((a, b) => {
          const dayA = visibleDays.indexOf(String(a.day || ''))
          const dayB = visibleDays.indexOf(String(b.day || ''))
          if (dayA !== dayB) return dayA - dayB
          return toMinutes(String(a.time || '')) - toMinutes(String(b.time || ''))
        })

        return {
          provider,
          rows: sortedRows,
          appointmentCount: sortedRows.length,
          nextSession: sortedRows[0] || null,
        }
      })
      .sort((a, b) => a.provider.localeCompare(b.provider))
  }, [therapyRows, visibleDays])

  const scheduleConflicts = useMemo(() => {
    const warnings: string[] = []
    const keys = new Set<string>()

    therapyRows.forEach((row, index) => {
      therapyRows.slice(index + 1).forEach(other => {
        const sameDay = String(row.day || '') === String(other.day || '')
        const sameTime = String(row.time || '') === String(other.time || '')
        if (!sameDay || !sameTime) return

        if (row.staffId && other.staffId && String(row.staffId) === String(other.staffId) && String(row.student || '') !== String(other.student || '')) {
          const key = `staff:${row.day}:${row.time}:${row.staffId}`
          if (!keys.has(key)) {
            keys.add(key)
            warnings.push(`${row.day} ${row.time}: ${row.student} and ${other.student} are both assigned to ${STAFF.find(staff => String(staff.id) === String(row.staffId))?.name || 'the same therapist'}.`)
          }
        }

        if (String(row.student || '') && String(row.student || '') === String(other.student || '')) {
          const key = `student:${row.day}:${row.time}:${row.student}`
          if (!keys.has(key)) {
            keys.add(key)
            warnings.push(`${row.day} ${row.time}: ${row.student} is double-booked for ${row.type} and ${other.type}.`)
          }
        }
      })
    })

    return warnings
  }, [therapyRows, STAFF])

  const studentsNotInClass = students.filter(student => !isInClassroom(student))

  const classroomCoverage = useMemo(() => {
    const selectedPeriod = SCHEDULE_PERIODS[0] || null
    return (CLASSES || []).map(cls => ({
      classInfo: cls,
      snapshot: buildClassroomCoverageSnapshot(students, cls.id, selectedPeriod),
    }))
  }, [CLASSES, SCHEDULE_PERIODS, students])

  useEffect(() => {
    if (!selectedCoverageClassId && classroomCoverage.length > 0) {
      setSelectedCoverageClassId(classroomCoverage[0].classInfo.id)
    }
  }, [classroomCoverage, selectedCoverageClassId])

  const selectedCoverage = classroomCoverage.find(item => item.classInfo.id === selectedCoverageClassId) || classroomCoverage[0] || null

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>🗓️ Schedule</h1>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Planning Window: {planningWindowLabel}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Forward view for upcoming pull-outs and coverage conflicts.</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Today / Next 3 Days / Next 5 Days affects upcoming sessions and conflict planning only.</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Today', value: 1 },
              { label: 'Next 3 Days', value: 3 },
              { label: 'Next 5 Days', value: 5 },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setHorizonDays(option.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: `1px solid ${horizonDays === option.value ? '#5f83aa' : '#d8e1ec'}`,
                  background: horizonDays === option.value ? '#dbe8f5' : '#ffffff',
                  color: horizonDays === option.value ? '#112f4d' : '#334155',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Upcoming Therapy Sessions</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{therapyRows.length}</div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Students Out Of Class Now</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{studentsNotInClass.length}</div>
          </div>
          <div style={{ border: `1px solid ${scheduleConflicts.length > 0 ? '#fecaca' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 12px', background: scheduleConflicts.length > 0 ? '#fff7f7' : '#f8fafc' }}>
            <div style={{ fontSize: 11, color: scheduleConflicts.length > 0 ? '#9f1239' : '#64748b', fontWeight: 700 }}>Schedule Conflicts</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: scheduleConflicts.length > 0 ? '#9f1239' : '#0f172a', marginTop: 4 }}>{scheduleConflicts.length}</div>
          </div>
        </div>

        {scheduleConflicts.length > 0 && (
          <div style={{ marginTop: 10, border: '1px solid #fecaca', borderRadius: 10, background: '#fff7f7', overflow: 'hidden' }}>
            <button
              onClick={() => setShowConflicts(prev => !prev)}
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', padding: '9px 11px', fontSize: 12, fontWeight: 800, color: '#9f1239', cursor: 'pointer' }}
            >
              Schedule Conflicts ({scheduleConflicts.length}) {showConflicts ? '▲' : '▼'}
            </button>
            {showConflicts && (
              <div style={{ borderTop: '1px solid #fecaca', padding: '8px 11px' }}>
                {scheduleConflicts.map((warning, index) => (
                  <div key={`${warning}-${index}`} style={{ fontSize: 11.5, color: '#7f1d1d', padding: '1px 0' }}>⚠ {warning}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ ...S.card, marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🏫 Live Classroom Coverage Now</div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Live class counts are current-now and do not change when you switch planning window filters.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {classroomCoverage.map(({ classInfo, snapshot }) => (
            <button
              key={classInfo.id}
              onClick={() => setSelectedCoverageClassId(classInfo.id)}
              style={{
                textAlign: 'left',
                border: `1px solid ${selectedCoverageClassId === classInfo.id ? '#5f83aa' : '#e2e8f0'}`,
                borderRadius: 10,
                padding: '10px 12px',
                background: selectedCoverageClassId === classInfo.id ? '#dbe8f5' : '#ffffff',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 12 }}>{classInfo.name}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{snapshot.metrics.present} of {snapshot.expectedCount} in class</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{snapshot.metrics.absent} absent · {snapshot.metrics.late} late · {snapshot.metrics.pullout} pullout</div>
            </button>
          ))}
        </div>
        {selectedCoverage && (
          <div style={{ marginTop: 12, border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{selectedCoverage.classInfo.name} · {selectedCoverage.snapshot.expectedCount} expected</div>
              <button
                onClick={() => setCompactCoverageRows(prev => !prev)}
                style={{ ...S.btn('ghost'), padding: '4px 9px', fontSize: 11 }}
              >
                {compactCoverageRows ? 'Expanded Rows' : 'Compact Rows'}
              </button>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {selectedCoverage.snapshot.students.map(entry => {
                const student = students.find(item => String(item.id) === String(entry.studentId))
                const nextSession = nextSessionByStudentName.get(String(entry.studentName || '').trim().toLowerCase()) || null
                return (
                  <button
                    key={entry.studentId}
                    onClick={() => student && openStudent(student, 'tracking')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: compactCoverageRows ? 'center' : 'flex-start', gap: 8, borderRadius: 8, padding: compactCoverageRows ? '7px 9px' : '8px 10px', background: '#ffffff', border: '1px solid #e2e8f0', textAlign: 'left', cursor: student ? 'pointer' : 'default' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {compactCoverageRows ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(76px, auto) minmax(160px, 1.2fr)', gap: 8, alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12 }}>{entry.studentName}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.3 }}>{entry.expectedLocation} → {entry.actualCurrentLocation}</div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>{entry.status}</div>
                          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.35 }}>
                            <div><strong>Assigned provider:</strong> {entry.provider} · {entry.serviceType}</div>
                            <div><strong>Next session:</strong> {nextSession ? `${nextSession.day} ${nextSession.time}` : 'None in schedule'}</div>
                            <div>{entry.scheduledDeparture} / {entry.actualDeparture} · {entry.expectedReturn} / {entry.actualReturn}</div>
                            <div>{entry.scheduledVersusUnexpected} · {entry.approvedVersusUnexplained} · {entry.statusCode}</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{entry.studentName}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                            <div><strong>Expected:</strong> {entry.expectedLocation}</div>
                            <div><strong>Actual:</strong> {entry.actualCurrentLocation}</div>
                            <div><strong>Assigned provider:</strong> {entry.provider} · {entry.serviceType}</div>
                            <div><strong>Next session:</strong> {nextSession ? `${nextSession.day} ${nextSession.time}` : 'None in schedule'}</div>
                            <div><strong>Departure:</strong> {entry.scheduledDeparture} / {entry.actualDeparture} · <strong>Return:</strong> {entry.expectedReturn} / {entry.actualReturn}</div>
                            <div><strong>Flow:</strong> {entry.scheduledVersusUnexpected} · {entry.approvedVersusUnexplained} · {entry.statusCode}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>{entry.status}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Daily Schedule — Dargei Beis</div>
          {SCHEDULE_PERIODS.map((period, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: period.type === 'break' ? '#f9fafb' : '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8, opacity: period.type === 'break' ? 0.7 : 1 }}>
              {period.type === 'class' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{period.id}</div>}
              {period.type === 'break' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#e5e7eb', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>—</div>}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{period.subject}</div>
                {period.teachers.length > 0 && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{period.teachers.join(' · ')}</div>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: period.type === 'break' ? '#94a3b8' : '#0f172a' }}>{period.time}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>🧠 Therapy & BCBA ({visibleDays.join(', ')})</div>
              <button
                onClick={() => setCompactTherapyRows(prev => !prev)}
                style={{ ...S.btn('ghost'), padding: '4px 9px', fontSize: 11 }}
              >
                {compactTherapyRows ? 'Expanded Rows' : 'Compact Rows'}
              </button>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {therapyProviders.map(provider => {
                const isExpanded = Boolean(expandedProviders[provider.provider])
                const previewRows = provider.rows.slice(0, 3)
                const shownRows = isExpanded ? provider.rows : previewRows
                return (
                  <div key={provider.provider} style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: '7px 8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) auto auto', gap: 10, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{provider.provider}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {provider.nextSession ? `${provider.nextSession.day} ${provider.nextSession.time} • ${provider.nextSession.type || 'Service'}` : 'No upcoming session'}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{provider.appointmentCount} appt</div>
                      <button onClick={() => setExpandedProviders(prev => ({ ...prev, [provider.provider]: !isExpanded }))} style={{ ...S.btn('ghost'), padding: '4px 8px', fontSize: 11 }}>
                        {isExpanded ? 'Collapse' : `Show all (${provider.appointmentCount})`}
                      </button>
                    </div>
                    <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
                      {shownRows.map((item, index) => (
                        <div key={`${provider.provider}-${index}`} style={{ display: 'grid', gridTemplateColumns: compactTherapyRows ? '80px minmax(105px, 1fr) minmax(70px, 0.8fr) minmax(80px, 0.9fr) auto' : '95px minmax(130px, 1fr) minmax(90px, 0.8fr) minmax(100px, 0.9fr) auto', gap: 8, alignItems: 'center', border: '1px solid #eef2f7', borderRadius: 7, padding: compactTherapyRows ? '4px 6px' : '6px 8px', fontSize: compactTherapyRows ? 10.8 : 11.5 }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.day} {item.time}</div>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.student || 'Unknown student'}</div>
                          <div style={{ color: '#475569' }}>{item.type || item.service || 'Service'}</div>
                          <div style={{ color: '#64748b' }}>{item.className || item.classId || item.location || 'Class/Location'}</div>
                          <div style={{ color: '#475569' }}>{item.duration || '30 min'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {therapyProviders.length === 0 && <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '6px 0' }}>No therapy sessions in this planning window.</div>}
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📍 Not In Class Now</div>
            {studentsNotInClass.map((student, index) => {
              const withStaffObj = student.withStaff ? STAFF.find(staff => staff.id === student.withStaff) : null
              return (
                <div key={student.id} onClick={() => openStudent(student)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: student.status === 'unknown' ? '#fef2f2' : '#ffffff', borderRadius: 6, cursor: 'pointer', border: `1px solid ${student.status === 'unknown' ? '#fecaca' : '#e2e8f0'}`, marginBottom: 6 }}>
                  <div style={S.avatar(index, 28)}>{initials(student.name)}</div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12 }}>{student.name}</div><div style={{ fontSize: 11, color: statusColor[student.status] }}>{statusEmoji[student.status]} {statusLabel[student.status]}{withStaffObj ? ` · ${withStaffObj.name}` : ''}</div></div>
                </div>
              )
            })}
            {studentsNotInClass.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>All present ✅</div>}
          </div>
        </div>
      </div>
    </div>
  )
}