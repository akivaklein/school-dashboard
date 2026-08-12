import { useEffect, useMemo, useState } from 'react'
import { isInClassroom } from '../utils/attendancePresence'
import { buildClassroomCoverageForecast, debugCoverageForecastMatching } from './scheduleCoverageForecast'

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
  const [selectedForecastPointKey, setSelectedForecastPointKey] = useState<string | null>(null)
  const [showConflicts, setShowConflicts] = useState(false)
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({})
  const [compactTherapyRows, setCompactTherapyRows] = useState(true)

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

  const classroomForecast = useMemo(() => {
    return buildClassroomCoverageForecast({
      students,
      classes: CLASSES || [],
      schedulePeriods: SCHEDULE_PERIODS || [],
      therapySchedule: THERAPY_SCHEDULE || [],
      horizonDays,
    })
  }, [students, CLASSES, SCHEDULE_PERIODS, THERAPY_SCHEDULE, horizonDays])

  const forecastDiagnostics = useMemo(() => {
    if (!import.meta.env.DEV) return null
    return debugCoverageForecastMatching({
      students,
      classes: CLASSES || [],
      therapySchedule: THERAPY_SCHEDULE || [],
      horizonDays,
    })
  }, [students, CLASSES, THERAPY_SCHEDULE, horizonDays])

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
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📈 Classroom Coverage Forecast</div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Compact timeline by class. Click a time point to inspect expected students, missing students, and pull-out destinations.</div>

        {import.meta.env.DEV && forecastDiagnostics && (
          <details style={{ border: '1px solid #e2e8f0', borderRadius: 9, background: '#f8fafc', marginBottom: 10, padding: '7px 9px' }}>
            <summary style={{ cursor: 'pointer', fontSize: 11, fontWeight: 800, color: '#334155' }}>
              Forecast Diagnostics (dev-only)
            </summary>
            <div style={{ marginTop: 7, fontSize: 10.5, color: '#475569', lineHeight: 1.45 }}>
              <div>Rows received: {forecastDiagnostics.sourceRowsReceived}</div>
              <div>From therapy_schedule: {forecastDiagnostics.sourceRowsFromTherapySchedule}</div>
              <div>From student therapyAssignments: {forecastDiagnostics.sourceRowsFromStudentAssignments}</div>
              <div>Inside selected date window: {forecastDiagnostics.insideWindow}</div>
              <div>Matched to students: {forecastDiagnostics.matchedToStudent}</div>
              <div>Accepted for coverage: {forecastDiagnostics.acceptedForCoverage}</div>
              <div>Rejected outside window: {forecastDiagnostics.rejected.outsideWindow}</div>
              <div>Rejected missing student match: {forecastDiagnostics.rejected.missingStudentMatch}</div>
              <div>Rejected invalid time window: {forecastDiagnostics.rejected.invalidTimeWindow}</div>
              <div>Rejected class mismatch: {forecastDiagnostics.rejected.classHintMismatch}</div>
            </div>
          </details>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {classroomForecast.map(classForecast => (
            <div key={classForecast.classId} style={{ border: '1px solid #dbe3ee', borderRadius: 10, background: '#ffffff', padding: '9px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{classForecast.className}</div>
                <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700 }}>{classForecast.rosterCount} students</div>
              </div>

              {classForecast.points.length > 0 ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {classForecast.points.map(point => {
                    const isSelected = selectedForecastPointKey === point.key
                    return (
                      <button
                        key={point.key}
                        onClick={() => setSelectedForecastPointKey(prev => prev === point.key ? null : point.key)}
                        style={{
                          border: `1px solid ${isSelected ? '#456a93' : '#d9e4f0'}`,
                          background: isSelected ? '#e3edf8' : '#f8fbff',
                          borderRadius: 999,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 10.5, color: '#334155', fontWeight: 700 }}>{point.label}</span>
                        <span style={{ fontSize: 11, color: '#0f172a', fontWeight: 900 }}>{point.expectedCount}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#94a3b8' }}>No class-time pull-out changes in this planning window.</div>
              )}

              {classForecast.points.map(point => {
                if (selectedForecastPointKey !== point.key) return null

                return (
                  <div key={`${point.key}-details`} style={{ marginTop: 9, border: '1px solid #e2e8f0', borderRadius: 9, background: '#f8fafc', padding: '9px 10px' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#1e293b' }}>
                      {point.label} · {point.dayName} · {point.classBlock.timeLabel}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                      {classForecast.className} · Period {point.classBlock.periodId} · {point.classBlock.subject}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                      <div style={{ border: '1px solid #d9e2ec', borderRadius: 8, background: '#ffffff', padding: '7px 8px' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f172a' }}>Students Expected In Class ({point.expectedStudents.length})</div>
                        <div style={{ marginTop: 5, display: 'grid', gap: 4 }}>
                          {point.expectedStudents.length > 0 ? point.expectedStudents.map(expected => {
                            const student = students.find(item => String(item.id) === String(expected.id))
                            return (
                              <button
                                key={`${point.key}-expected-${expected.id}`}
                                onClick={() => student && openStudent(student, 'tracking')}
                                style={{
                                  border: '1px solid #e2e8f0',
                                  background: '#f8fbff',
                                  borderRadius: 7,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  color: '#334155',
                                  textAlign: 'left',
                                  padding: '4px 6px',
                                  cursor: student ? 'pointer' : 'default',
                                }}
                              >
                                {expected.name}
                              </button>
                            )
                          }) : <div style={{ fontSize: 10.5, color: '#94a3b8' }}>No students expected in class.</div>}
                        </div>
                      </div>

                      <div style={{ border: '1px solid #d9e2ec', borderRadius: 8, background: '#ffffff', padding: '7px 8px' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#7c2d12' }}>Students Missing From Class ({point.missingStudents.length})</div>
                        <div style={{ marginTop: 5, display: 'grid', gap: 6 }}>
                          {point.missingStudents.length > 0 ? point.missingStudents.map(missing => {
                            const student = students.find(item => String(item.id) === String(missing.studentId))
                            return (
                              <button
                                key={`${point.key}-missing-${missing.studentId}`}
                                onClick={() => student && openStudent(student, 'tracking')}
                                style={{
                                  border: '1px solid #f1d5c8',
                                  background: '#fffaf7',
                                  borderRadius: 7,
                                  textAlign: 'left',
                                  padding: '5px 6px',
                                  cursor: student ? 'pointer' : 'default',
                                }}
                              >
                                <div style={{ fontSize: 10.8, fontWeight: 800, color: '#7c2d12' }}>{missing.studentName}</div>
                                <div style={{ fontSize: 10.2, color: '#9a3412', marginTop: 2 }}>{missing.whereGoing}</div>
                                <div style={{ fontSize: 10, color: '#7b4b2a', marginTop: 2 }}>Provider: {missing.providerName}</div>
                                <div style={{ fontSize: 10, color: '#7b4b2a' }}>Service: {missing.serviceType}</div>
                                <div style={{ fontSize: 10, color: '#7b4b2a' }}>Departure: {missing.departureTime}</div>
                                <div style={{ fontSize: 10, color: '#7b4b2a' }}>Expected return: {missing.expectedReturnTime}</div>
                              </button>
                            )
                          }) : <div style={{ fontSize: 10.5, color: '#94a3b8' }}>No students missing from class.</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {classroomForecast.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8' }}>No forecastable classroom blocks found.</div>}
        </div>
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