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

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const jsDayToName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = jsDayToName[new Date().getDay()]

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
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Leadership Planning Window</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Forward view for upcoming pull-outs and coverage conflicts.</div>
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
          <div style={{ marginTop: 12, border: '1px solid #fecaca', borderRadius: 10, background: '#fff7f7', padding: '10px 12px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#9f1239', marginBottom: 6 }}>Conflict Warnings</div>
            {scheduleConflicts.slice(0, 5).map((warning, index) => (
              <div key={`${warning}-${index}`} style={{ fontSize: 12, color: '#7f1d1d', padding: '2px 0' }}>
                ⚠ {warning}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...S.card, marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🏫 Classroom coverage snapshot</div>
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
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{selectedCoverage.classInfo.name} · {selectedCoverage.snapshot.expectedCount} expected</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {selectedCoverage.snapshot.students.map(entry => {
                const student = students.find(item => String(item.id) === String(entry.studentId))
                return (
                  <button
                    key={entry.studentId}
                    onClick={() => student && openStudent(student, 'tracking')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderRadius: 8, padding: '8px 10px', background: '#ffffff', border: '1px solid #e2e8f0', textAlign: 'left', cursor: student ? 'pointer' : 'default' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{entry.studentName}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                        <div><strong>Expected:</strong> {entry.expectedLocation}</div>
                        <div><strong>Actual:</strong> {entry.actualCurrentLocation}</div>
                        <div><strong>Provider:</strong> {entry.provider} · {entry.serviceType}</div>
                        <div><strong>Departure:</strong> {entry.scheduledDeparture} / {entry.actualDeparture} · <strong>Return:</strong> {entry.expectedReturn} / {entry.actualReturn}</div>
                        <div><strong>Flow:</strong> {entry.scheduledVersusUnexpected} · {entry.approvedVersusUnexplained} · {entry.statusCode}</div>
                      </div>
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
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 Therapy Pullouts ({visibleDays.join(', ')})</div>
            {therapyRows.map((item, index) => {
              const staffMember = STAFF.find(staff => staff.id === item.staffId)
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#5b5f7a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{item.day}</div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{item.student}</div><div style={{ fontSize: 11, color: '#64748b' }}>{staffMember?.name} · {item.type}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, fontWeight: 700 }}>{item.time}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{item.duration}</div></div>
                </div>
              )
            })}
            {therapyRows.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>No therapy sessions in this planning window.</div>}
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