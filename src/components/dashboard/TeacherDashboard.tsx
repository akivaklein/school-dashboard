import { useState, useEffect, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import playSound from '../../utils/playSound'
import {
  isInClassroom,
  isInSchool,
  getDailyAttendanceStatus,
  getCurrentLocationStatus,
} from '../../utils/attendancePresence'
import { getInstructionalGroupStudentIds, useCurrentInstructionalPeriod } from '../../utils/instructionalGroupUtils'
import type { InstructionalGroup, InstructionalGroupMembership, InstructionalPeriod, PhysicalRoom } from '../../services/instructionalGroupService'
import {
  SCHEDULE_PERIODS,
  CLASSES,
  buildClassroomCoverageSnapshot,
  resolveStudentClassId,
  statusLabel,
} from '../dashboardData'
import { S, initials, type StudentLike, type StaffMemberLike } from './dashboardHelpers'

export function TeacherDashboard({ students, allStudents, setStudents, userName, setSelectedStudent, setTeachingMode, setPage, initialClass = null, setDrillDown, recordStudentPointsAction, isVIP, staffMembers, instructionalPeriods, physicalRooms, instructionalGroups, instructionalGroupMemberships }: { students: StudentLike[]; allStudents: StudentLike[]; setStudents: Dispatch<SetStateAction<StudentLike[]>>; userName: string | null; setSelectedStudent: (student: StudentLike) => void; setTeachingMode: Dispatch<SetStateAction<boolean>>; setPage: (page: string) => void; initialClass?: string | number | null; setDrillDown: Dispatch<SetStateAction<{ title: string; students: StudentLike[] } | null>>; recordStudentPointsAction: (payload: { studentId: number | string; pointsDelta: number; reminderDelta?: number; reason: string; eventType: string; category: string; sourceContext: string; note?: string | null; metadata?: Record<string, unknown> }) => Promise<boolean>; isVIP: (student: StudentLike) => boolean; staffMembers: StaffMemberLike[]; instructionalPeriods: InstructionalPeriod[]; physicalRooms: PhysicalRoom[]; instructionalGroups: InstructionalGroup[]; instructionalGroupMemberships: InstructionalGroupMembership[] }) {
  const [selectedClass, setSelectedClass] = useState(initialClass)
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const currentTimeLabel = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  useEffect(() => {
    setSelectedClass(initialClass)
  }, [initialClass])

  const getStudentClassId = (student: StudentLike) => resolveStudentClassId(student)

  const classStudents = selectedClass
    ? students.filter((s: StudentLike) => getStudentClassId(s) === selectedClass)
    : students

  const currentPeriod = SCHEDULE_PERIODS[0]
  const coverageSnapshot = useMemo(
    () => buildClassroomCoverageSnapshot(classStudents, selectedClass, currentPeriod),
    [classStudents, selectedClass, currentPeriod],
  )
  const present = coverageSnapshot.metrics.present
  const absent = coverageSnapshot.metrics.absent
  const late = coverageSnapshot.metrics.late
  const inTherapy = coverageSnapshot.students.filter((entry: { status: string }) => entry.status === 'pullout').length
  const withBT = coverageSnapshot.students.filter((entry: { status: string; currentStatus?: string }) => entry.status === 'pullout' && entry.currentStatus === 'with-bt').length
  const unknown = coverageSnapshot.students.filter((entry: { status: string }) => entry.status === 'unknown').length
  const unresolved = classStudents.filter((s: StudentLike) => !isInClassroom(s) && !isInSchool(s) && getDailyAttendanceStatus(s) !== 'absent' && getDailyAttendanceStatus(s) !== 'late').length
  const pulloutStudents = classStudents.filter((s: StudentLike) => ['therapy', 'with-bt', 'unknown'].includes(String(s.status)))
  const currentClassInfo = selectedClass ? CLASSES.find(c => c.id === selectedClass) : null
  const expectedRoster = coverageSnapshot.expectedCount
  const confirmedInClass = present
  const nextPullout = pulloutStudents[0]
  const currentInstructionalPeriod = useCurrentInstructionalPeriod(instructionalPeriods)
  const normalizedTeacherName = String(userName || '').trim().toLowerCase()
  const currentTeacherGroups = currentInstructionalPeriod
    ? instructionalGroups.filter(group => group.status !== 'archived' && group.period_id === currentInstructionalPeriod.id && group.teacher_name.trim().toLowerCase() === normalizedTeacherName)
    : []

  async function quickPoints(id: number | string, amount: number) {
    playSound(amount > 0 ? 'positive' : 'negative')
    await recordStudentPointsAction({
      studentId: id,
      pointsDelta: amount,
      reminderDelta: amount < 0 ? 1 : 0,
      reason: amount > 0 ? `+${amount} pts` : `${amount} pts`,
      eventType: amount > 0 ? 'award' : 'deduction',
      category: 'teacher-dashboard',
      sourceContext: 'teacher-dashboard-quick-action',
    })
  }
  async function quickReminder(id: number | string) {
    playSound('negative')
    await recordStudentPointsAction({
      studentId: id,
      pointsDelta: 0,
      reminderDelta: 1,
      reason: 'Reminder',
      eventType: 'reminder',
      category: 'teacher-dashboard',
      sourceContext: 'teacher-dashboard-quick-action',
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#16243a' }}>{userName ? `Good afternoon, ${userName}` : 'Teacher Dashboard'}</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>{todayLabel} · {currentTimeLabel}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setPage('attendance')} style={{ ...S.btn('primary'), padding: '8px 14px', fontSize: 13 }}>Classroom Attendance</button>
            <button onClick={() => setTeachingMode(true)} style={{ ...S.btn('ghost'), padding: '8px 14px', fontSize: 13 }}>Start Class Session</button>
          </div>
        </div>
      </div>

      <div style={{ ...S.card, marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#16243a' }}>My Instructional Groups Now</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 10 }}>{currentInstructionalPeriod?.name || 'No configured instructional period is running now.'}</div>
        {currentTeacherGroups.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
          {currentTeacherGroups.map(group => {
            const memberIds = new Set(getInstructionalGroupStudentIds(group.id, instructionalGroupMemberships))
            const groupStudents = allStudents.filter(student => memberIds.has(Number(student.id)))
            const room = physicalRooms.find(item => item.id === group.room_id)
            return <button key={group.id} onClick={() => setDrillDown({ title: `${group.name} · ${currentInstructionalPeriod?.name}`, students: groupStudents })} style={{ border: '1px solid #d7e1ec', borderRadius: 8, background: '#fff', padding: 12, textAlign: 'left', cursor: 'pointer' }}><div style={{ fontWeight: 800, color: '#102a43' }}>{group.name}</div><div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{group.subject || 'Subject not set'} · {room?.name || 'Room not set'}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>{groupStudents.length} students · {groupStudents.filter(student => isInSchool(student)).length} in school</div></button>
          })}
        </div> : currentInstructionalPeriod ? <div style={{ color: '#64748b', fontSize: 12 }}>No group is assigned to you for this period.</div> : null}
      </div>

      <div style={{ ...S.card, marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#16243a' }}>{currentClassInfo?.name || 'Current Class'}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              {currentPeriod?.subject || 'Class period'} · {currentPeriod?.time || 'Today'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...S.badge('#0f766e', '#ccfbf1') }}>{confirmedInClass} of {expectedRoster} in class</span>
            <span style={{ ...S.badge('#2563eb', '#dbeafe') }}>{absent} absent</span>
            <span style={{ ...S.badge('#9a6a2a', '#fef3c7') }}>{late} late</span>
            <span style={{ ...S.badge('#7c3aed', '#f5f3ff') }}>{coverageSnapshot.metrics.pullout} pullout</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 12 }}>
          {coverageSnapshot.students.slice(0, 6).map((entry: { studentName: string; status: string; location: string; studentId?: string | number; expectedLocation?: string; actualCurrentLocation?: string; provider?: string; serviceType?: string; scheduledDeparture?: string; expectedReturn?: string; actualDeparture?: string; actualReturn?: string; scheduledVersusUnexpected?: string; approvedVersusUnexplained?: string; statusCode?: string }, index: number) => (
            <div key={entry.studentId || `${entry.studentName}-${index}`} onClick={() => {
              const match = classStudents.find((item: StudentLike) => String(item.id) === String(entry.studentId))
              if (match) setSelectedStudent(match)
            }} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', background: '#f8fafc', cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{entry.studentName}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{entry.location}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                {entry.provider && <div>Provider: {entry.provider}</div>}
                {entry.serviceType && <div>Service: {entry.serviceType}</div>}
                {entry.scheduledDeparture && <div>Out {entry.scheduledDeparture} / back {entry.expectedReturn}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
        {([
          ['Confirmed', confirmedInClass, '#4f6687', classStudents.filter((s: StudentLike) => isInClassroom(s))],
          ['Absent', absent, '#9f1239', classStudents.filter((s: StudentLike) => getDailyAttendanceStatus(s) === 'absent')],
          ['Late', late, '#9a6a2a', classStudents.filter((s: StudentLike) => getDailyAttendanceStatus(s) === 'late')],
          ['Pullouts', inTherapy + withBT, '#6d28d9', pulloutStudents],
          ['Unknown', unknown, '#9f1239', classStudents.filter((s: StudentLike) => s.status === 'unknown')],
          ['Unresolved', unresolved, '#334155', classStudents.filter((s: StudentLike) => !isInClassroom(s) && !isInSchool(s) && getDailyAttendanceStatus(s) !== 'absent' && getDailyAttendanceStatus(s) !== 'late')],
        ] as Array<[string, number, string, StudentLike[]]>).map(([label, val, color, filtered]) => (
          <div key={label} onClick={() => filtered.length > 0 && setDrillDown({ title: `${label}`, students: filtered })}
            style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e2e8f0', textAlign: 'center', borderTop: `3px solid ${color}`, cursor: filtered.length > 0 ? 'pointer' : 'default' }}
            onMouseEnter={e => { if (filtered.length > 0) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🧭 Class timeline</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Expected roster · pullouts · returns</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Now</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16243a', marginTop: 4 }}>{expectedRoster} expected</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{confirmedInClass} in class · {absent} absent · {late} late</div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Next pullout</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16243a', marginTop: 4 }}>{nextPullout ? nextPullout.name : 'No pullouts scheduled'}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{nextPullout ? `${nextPullout.status} · ${nextPullout.withStaff || 'provider pending'}` : 'All students accounted for'}</div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Today</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16243a', marginTop: 4 }}>{currentPeriod?.subject || 'Class period'}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{currentPeriod?.time || 'Schedule available in the School Day view'}</div>
          </div>
        </div>
      </div>

      <div style={{ ...S.card, border: '1px solid #e3e8ef', borderRadius: 12, boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#233448' }}>{selectedClass ? CLASSES.find(c=>c.id===selectedClass)?.name : 'Class roster'} · Quick actions</div>
          <div style={{ marginTop: 2, fontSize: 10.5, color: '#738397', fontWeight: 600 }}>Professional classroom controls</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))', gap: 10 }}>
          {classStudents.map((s: StudentLike, i: number) => {
            const withStaffObj = s.withStaff ? staffMembers.find((st: StaffMemberLike) => String(st.id) === String(s.withStaff)) : null
            const vip = isVIP ? isVIP(s) : false
            const studentName = typeof s.name === 'string' ? s.name : 'Student'
            const studentStatus = typeof s.status === 'string' ? s.status : 'present'
            const attendanceStatus = getDailyAttendanceStatus(s)
            const locationStatus = getCurrentLocationStatus(s)
            const shouldShowPullout = ['therapy', 'with-bt', 'unknown'].includes(String(studentStatus))
            const isUnknownStatus = studentStatus === 'unknown'
            const cardBackground = vip ? '#fffcf2' : isUnknownStatus ? '#fff9f9' : '#ffffff'
            const cardBorder = vip ? '#ead7a2' : isUnknownStatus ? '#eccfd5' : '#dfe6ee'
            return (
              <div key={s.id} style={{ background: cardBackground, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: '10px 10px 9px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, cursor: 'pointer' }} onClick={() => setSelectedStudent(s)}>
                  <div style={S.avatar(i, 34)}>{initials(studentName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: '#24374b' }}>{studentName}{vip && ' ★'}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ ...S.tag('#536579', '#eef2f6'), fontSize: 9.5, fontWeight: 700 }}>Daily: {attendanceStatus}</span>
                      <span style={{ ...S.tag('#536579', '#f4f6f8'), fontSize: 9.5, fontWeight: 700 }}>Location: {locationStatus === 'not-confirmed' ? 'Not confirmed' : locationStatus === 'present' ? 'In Class' : statusLabel[locationStatus] || locationStatus}</span>
                      {shouldShowPullout && <span style={{ ...S.tag('#5d3ca8', '#f3effd'), fontSize: 9.5, fontWeight: 700 }}>Pullout</span>}
                      {withStaffObj && <span style={{ fontSize: 9.5, color: '#566b86', fontWeight: 700 }}>{withStaffObj.name}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ ...S.badge('#58697f', '#f3f6f9'), fontWeight: 800, fontSize: 10 }}>{s.points ?? 0} pts</span>
                  {(typeof s.reminders === 'number' ? s.reminders : 0) > 0 && <span style={{ ...S.badge('#8f1d3f', '#fde8ef'), fontWeight: 800, fontSize: 10 }}>⚠ {typeof s.reminders === 'number' ? s.reminders : 0}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
                  <button onClick={() => quickPoints(s.id, 2)} style={{ padding: '5px', borderRadius: 6, border: '1px solid #b7dccc', background: '#f7fcf9', color: '#365f48', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>+2</button>
                  <button onClick={() => quickPoints(s.id, 5)} style={{ padding: '5px', borderRadius: 6, border: '1px solid #b7dccc', background: '#f7fcf9', color: '#365f48', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>+5</button>
                  <button onClick={() => quickReminder(s.id)} style={{ padding: '5px', borderRadius: 6, border: '1px solid #efc3cd', background: '#fff8fa', color: '#8c2546', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>⚠</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
