import { useState } from 'react'
import { resolveActorName, resolveStudentClassId } from './dashboardData'
import {
  getDailyAttendanceStatus,
  isInClassroom,
  isInSchool,
  isLocationUnknown,
  isOutOfSchool,
  resolveClassroomStatusAfterAttendanceUpdate,
} from '../utils/attendancePresence'

type AttendanceStudent = { id: number | string; [key: string]: unknown }

export default function AttendancePage({
  students,
  setStudents,
  role,
  userName,
  attFilter,
  setAttFilter,
  filteredStudents,
  openStudent,
  persistStudentFields,
  persistStudentFieldsBulk,
  STAFF,
  S,
  initials,
  isVIP = (_student: AttendanceStudent) => false,
  DAYS,
  CLASSES,
  statusColor,
  statusEmoji,
  statusLabel,
  HISTORICAL_DATA,
}) {
  const [leavePopup, setLeavePopup] = useState(null)
  const [leaveReason, setLeaveReason] = useState('therapy')
  const [leaveStaffSearch, setLeaveStaffSearch] = useState('')
  const [leaveStaffId, setLeaveStaffId] = useState('')
  const [dailyView, setDailyView] = useState('daily')
  const [collapsed, setCollapsed] = useState(false)
  const [undoStack, setUndoStack] = useState([])
  const [latePopup, setLatePopup] = useState(null)
  const [lateTime, setLateTime] = useState('')
  const [lateReason, setLateReason] = useState('no-reason')
  const [lateNote, setLateNote] = useState('')
  const actingStaffName = resolveActorName(userName, role)

  function buildClassLogEntry(type, note, extra: { staffId?: number | string | null } = {}) {
    return {
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      type,
      note,
      staffId: extra.staffId || null,
      staffName: actingStaffName,
      recordedAt: new Date().toISOString(),
    }
  }

  async function saveStudentField(id, field, value) {
    const success = await persistStudentFields(id, { [field]: value })
    if (!success) alert('Unable to save student status to Supabase.')
    return success
  }

  async function saveStudentFields(id, fields) {
    const success = await persistStudentFields(id, fields)
    if (!success) alert('Unable to save student status to Supabase.')
    return success
  }

  async function updateDailyStatus(id, status) {
    const original = students.find(s => Number(s.id) === Number(id))
    if (!original) return

    const nextClassroomStatus = resolveClassroomStatusAfterAttendanceUpdate(
      original.status,
      status,
    )

    setUndoStack(u => [
      ...u.slice(-19),
      {
        type: 'single',
        id,
        dailyStatus: getDailyAttendanceStatus(original),
        status: original.status || 'present',
        lateDetails: original.lateDetails || null,
        withStaff: original.withStaff || null,
        classLog: original.classLog || []
      }
    ])

    const classLogEntry = buildClassLogEntry(
      'attendance-update',
      `Attendance marked ${status} by ${actingStaffName}`
    )
    const updatedClassLog = [...(original.classLog || []), classLogEntry]

    setStudents(prev =>
      prev.map(s =>
        Number(s.id) === Number(id)
          ? {
              ...s,
              dailyStatus: status,
              status: nextClassroomStatus,
              withStaff: nextClassroomStatus === 'present' ? null : s.withStaff,
              classLog: updatedClassLog
            }
          : s
      )
    )

    if (status === 'late') {
      setLatePopup(id)
      setLateTime('')
      setLateReason('no-reason')
      setLateNote('')
    }

    const success = await saveStudentFields(id, {
      dailyStatus: status,
      status: nextClassroomStatus,
      classLog: updatedClassLog
    })

    if (!success) {
      setStudents(prev =>
        prev.map(s =>
          Number(s.id) === Number(id)
            ? {
                ...s,
                dailyStatus: original.dailyStatus,
                status: original.status,
                lateDetails: original.lateDetails,
                withStaff: original.withStaff,
                classLog: original.classLog || []
              }
            : s
        )
      )
    }
  }

  async function undo() {
    if (undoStack.length === 0) return
    const last = undoStack[undoStack.length - 1]
    if (last.type === 'bulk') {
      setStudents(prev => prev.map(s => {
        const saved = last.snapshot.find(x => x.id === s.id)
        return saved
          ? {
              ...s,
              dailyStatus: saved.dailyStatus,
              lateDetails: saved.lateDetails,
              status: saved.status,
              withStaff: saved.withStaff,
              classLog: saved.classLog,
            }
          : s
      }))
      const success = await persistStudentFieldsBulk(
        last.snapshot.map(saved => ({
          id: saved.id,
          fields: {
            dailyStatus: saved.dailyStatus,
            lateDetails: saved.lateDetails,
            status: saved.status,
            withStaff: saved.withStaff,
            classLog: saved.classLog,
          }
        }))
      )
      if (!success) alert('Some attendance statuses could not be restored in Supabase.')
    } else {
      setStudents(prev => prev.map(s => s.id === last.id ? {
        ...s,
        dailyStatus: last.dailyStatus,
        lateDetails: last.lateDetails,
        status: last.status,
        withStaff: last.withStaff,
        classLog: last.classLog,
      } : s))
      await saveStudentFields(last.id, {
        dailyStatus: last.dailyStatus,
        lateDetails: last.lateDetails,
        status: last.status,
        withStaff: last.withStaff,
        classLog: last.classLog,
      })
    }
    setUndoStack(u => u.slice(0, -1))
  }

  async function confirmLate() {
    const studentId = latePopup
    if (!studentId) return

    const original = students.find(s => s.id === studentId)
    if (!original) return

    const lateDetails = {
      timeArrived: lateTime,
      reason: lateReason,
      note: lateNote,
      markedBy: actingStaffName,
      markedAt: new Date().toISOString(),
    }

    const classLogEntry = buildClassLogEntry(
      'late-details',
      `Late details saved by ${actingStaffName}`
    )
    const updatedClassLog = [...(original.classLog || []), classLogEntry]

    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? { ...s, lateDetails, classLog: updatedClassLog }
          : s
      )
    )

    const success = await saveStudentFields(studentId, {
      lateDetails,
      classLog: updatedClassLog,
    })

    if (!success) {
      setStudents(prev =>
        prev.map(s =>
          s.id === studentId
            ? {
                ...s,
                lateDetails: original.lateDetails,
                classLog: original.classLog,
              }
            : s
        )
      )
    }

    setLatePopup(null)
  }

  const filteredStaff = leaveStaffSearch.length > 0
    ? STAFF.filter(st => st.name.toLowerCase().includes(leaveStaffSearch.toLowerCase()) || st.role.toLowerCase().includes(leaveStaffSearch.toLowerCase()))
    : STAFF

  async function handleToggle(s) {
    if (role === 'therapist' && isInClassroom(s)) {
      return
    }

    if (s.status === 'present') {
      setLeavePopup(s.id)
      setLeaveReason('therapy')
      setLeaveStaffSearch('')
      setLeaveStaffId('')
    } else {
      const original = s
      const wasNotInSchool = !isInSchool(s)
      const arrivedNow = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })

      setStudents(prev => prev.map(x => {
        if (x.id !== s.id) return x

        if (!wasNotInSchool) {
          const classLogEntry = buildClassLogEntry(
            'in',
            `Returned to class (marked by ${actingStaffName})`
          )
          return {
            ...x,
            status: 'present',
            withStaff: null,
            unknownSince: null,
            classLog: [
              ...(x.classLog || []),
              classLogEntry
            ]
          }
        }

        const classLogEntry = buildClassLogEntry(
          'in',
          `Arrived late to yeshiva (marked by ${actingStaffName})`
        )
        return {
          ...x,
          status: 'present',
          dailyStatus: 'late',
          withStaff: null,
          unknownSince: null,
          lateDetails: {
            timeArrived: arrivedNow,
            reason: 'arrived-late',
            note: 'Marked present from School-Wide Mode',
            markedBy: actingStaffName,
            markedAt: new Date().toISOString(),
          },
          classLog: [
            ...(x.classLog || []),
            classLogEntry
          ]
        }
      }))

      const updatedStudent = students.find(s => s.id === original.id)
      const fields = wasNotInSchool
        ? {
            status: 'present',
            dailyStatus: 'late',
            withStaff: null,
            unknownSince: null,
            lateDetails: {
              timeArrived: arrivedNow,
              reason: 'arrived-late',
              note: 'Marked present from School-Wide Mode',
              markedBy: actingStaffName,
              markedAt: new Date().toISOString(),
            },
            classLog: updatedStudent?.classLog || []
          }
        : { status: 'present', withStaff: null, unknownSince: null, classLog: updatedStudent?.classLog || [] }
      const success = await saveStudentFields(s.id, fields)
      if (!success) {
        setStudents(prev => prev.map(x => x.id === s.id ? original : x))
      }
    }
  }

  async function confirmLeave() {
    const studentId = leavePopup
    if (!studentId) return
    const original = students.find(x => x.id === studentId)
    const statusMap = { therapy: 'therapy', 'with-bt': 'with-bt', menahel: 'unknown', hallway: 'unknown', other: 'unknown' }
    const newStatus = statusMap[leaveReason] || 'unknown'
    const unknownSince = newStatus === 'unknown' ? new Date().toISOString() : null
    const classLogEntry = buildClassLogEntry(
      'out',
      `Left class (${leaveReason})`,
      { staffId: leaveStaffId || null }
    )
    setStudents(prev => prev.map(x => x.id === studentId ? {
      ...x,
      status: newStatus,
      withStaff: leaveStaffId || null,
      unknownSince,
      classLog: [...(x.classLog || []), classLogEntry]
    } : x))
    setLeavePopup(null)

    const success = await saveStudentFields(studentId, {
      status: newStatus,
      withStaff: leaveStaffId || null,
      unknownSince,
      classLog: [...(original?.classLog || []), classLogEntry],
    })
    if (!success && original) {
      setStudents(prev => prev.map(x => x.id === studentId ? original : x))
    }
  }

  async function resolveFlaggedStudentsForClass(classId) {
    const classStudents = students.filter(s => s?.is_active !== false && resolveStudentClassId(s) === classId)
    const flaggedStudents = classStudents.filter(
      s => s.status === 'unknown' || s.status === 'not-arrived'
    )

    if (flaggedStudents.length === 0) return

    const snapshot = flaggedStudents.map(student => ({
      id: student.id,
      status: student.status,
      dailyStatus: student.dailyStatus,
      withStaff: student.withStaff,
      unknownSince: student.unknownSince || null,
      classLog: student.classLog || [],
    }))

    const updatesById = {}
    flaggedStudents.forEach(student => {
      const logEntry = buildClassLogEntry(
        'status-update',
        `Resolved from status board by ${actingStaffName}`
      )

      const nextDailyStatus =
        getDailyAttendanceStatus(student) === 'absent' ? 'late' : 'present'

      updatesById[student.id] = {
        status: 'present',
        dailyStatus: nextDailyStatus,
        withStaff: null,
        unknownSince: null,
        classLog: [...(student.classLog || []), logEntry],
      }
    })

    setStudents(prev => prev.map(student => {
      const update = updatesById[student.id]
      return update ? { ...student, ...update } : student
    }))

    const success = await persistStudentFieldsBulk(
      flaggedStudents.map(student => ({
        id: student.id,
        fields: updatesById[student.id],
      }))
    )

    if (!success) {
      const rollbackById = {}
      snapshot.forEach(saved => {
        rollbackById[saved.id] = saved
      })

      setStudents(prev => prev.map(student => {
        const rollback = rollbackById[student.id]
        return rollback ? { ...student, ...rollback } : student
      }))

      alert('Could not resolve all flagged students for this class.')
    }
  }

  const leaveStudent = leavePopup ? students.find(s => s.id === leavePopup) : null

  return (
    <div>
      {latePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 'min(94vw, 420px)', boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#9a6a2a', padding: '14px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{students.find(s => s.id === latePopup)?.name} - Late Details</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Optional — fill in what you know</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Time Arrived</div>
                <input type="time" value={lateTime} onChange={e => setLateTime(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Reason</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[['no-reason','No reason given'],['parent-called','Parent called ahead'],['sick','Sick / not feeling well'],['transport','Transportation issue'],['appointment','Doctor appointment'],['other','Other']].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: `2px solid ${lateReason === val ? '#9a6a2a' : '#e5e7eb'}`, cursor: 'pointer', background: lateReason === val ? '#fffbeb' : '#fff' }}>
                      <input type="radio" name="lateReason" value={val} checked={lateReason === val} onChange={() => setLateReason(val)} />
                      <span style={{ fontWeight: lateReason === val ? 700 : 400, fontSize: 13 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Note (optional)</div>
                <input value={lateNote} onChange={e => setLateNote(e.target.value)} placeholder="e.g. Father called at 9am, said coming by 10..." spellCheck lang="en" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLatePopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Skip</button>
                <button onClick={confirmLate} style={{ ...S.btn('primary'), flex: 1 }}>Save Details</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {leavePopup && leaveStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 'min(94vw, 420px)', boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '16px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{leaveStudent.name} is leaving class</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Select reason for leaving</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Reason</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['therapy', 'Therapy'],
                    ['with-bt', 'With BT'],
                    ['menahel', 'Called to Menahel'],
                    ['hallway', 'Location Unknown'],
                    ['other', 'Other'],
                  ].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `2px solid ${leaveReason === val ? '#0f172a' : '#e5e7eb'}`, cursor: 'pointer', background: leaveReason === val ? '#f8fafc' : '#fff' }}>
                      <input type="radio" name="reason" value={val} checked={leaveReason === val} onChange={() => setLeaveReason(val)} />
                      <span style={{ fontWeight: leaveReason === val ? 700 : 400, fontSize: 14 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(leaveReason === 'therapy' || leaveReason === 'with-bt') && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>With whom? (start typing)</div>
                  <input
                    value={leaveStaffSearch}
                    onChange={e => { setLeaveStaffSearch(e.target.value); setLeaveStaffId('') }}
                    placeholder="Type staff name..."
                    spellCheck
                    lang="en"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 6 }}
                  />
                  {leaveStaffSearch.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      {filteredStaff.slice(0, 5).map(st => (
                        <div key={st.id} onClick={() => { setLeaveStaffId(st.id); setLeaveStaffSearch(st.name) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: leaveStaffId === st.id ? '#f8fafc' : '#fff', borderBottom: '1px solid #f8fafc' }}>
                          <span style={{ fontWeight: 600 }}>{st.name}</span>
                          <span style={{ color: '#64748b', marginLeft: 8, fontSize: 11 }}>{st.role}</span>
                        </div>
                      ))}
                      {filteredStaff.length === 0 && <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 13 }}>No staff found</div>}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLeavePopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={confirmLeave} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#16243a' }}>School Day</h1>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Attendance, arrivals, and live class status</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDailyView('daily')} style={{ ...S.btn(dailyView === 'daily' ? 'primary' : 'ghost'), padding: '7px 14px', fontSize: 12 }}>Daily Check-In</button>
          <button onClick={() => setDailyView('class')} style={{ ...S.btn(dailyView === 'class' ? 'primary' : 'ghost'), padding: '7px 14px', fontSize: 12 }}>Class Toggle</button>
          <button onClick={() => setDailyView('status-board')} style={{ ...S.btn(dailyView === 'status-board' ? 'primary' : 'ghost'), padding: '7px 14px', fontSize: 12 }}>Status Board</button>
          <button onClick={() => setDailyView('weekly')} style={{ ...S.btn(dailyView === 'weekly' ? 'primary' : 'ghost'), padding: '7px 14px', fontSize: 12 }}>Weekly Record</button>
        </div>
      </div>

      {dailyView === 'daily' && (
        <div style={S.card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              ['Present', students.filter(s => getDailyAttendanceStatus(s) === 'present').length, '#56765f', 'present'],
              ['Absent', students.filter(s => getDailyAttendanceStatus(s) === 'absent').length, '#9f1239', 'absent'],
              ['Late', students.filter(s => getDailyAttendanceStatus(s) === 'late').length, '#9a6a2a', 'late'],
              ['Left Early', students.filter(s => getDailyAttendanceStatus(s) === 'left-early').length, '#6d28d9', 'left-early'],
              ['Not Arrived / Unconfirmed', students.filter(s => ['not-arrived', 'unconfirmed'].includes(getDailyAttendanceStatus(s))).length, '#64748b', 'unconfirmed'],
            ].map(([label, val, color, status]) => (
              <div key={label} onClick={() => { const filtered = students.filter(s => getDailyAttendanceStatus(s) === status || (status === 'unconfirmed' && ['not-arrived', 'unconfirmed'].includes(getDailyAttendanceStatus(s)))); if (filtered.length > 0) { } }} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '12px', cursor: 'pointer', border: '2px solid transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `2px solid ${color}` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '2px solid transparent' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Who came to yeshiva today?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {undoStack.length > 0 && <button onClick={undo} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>Undo</button>}
              <button onClick={() => setCollapsed(c => !c)} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>{collapsed ? 'Expand All' : 'Collapse All'}</button>
              <button onClick={async () => {
                const targetIds = new Set(filteredStudents.map(s => Number(s.id)))
                if (targetIds.size === 0) return

                const snapshot = students
                  .filter(s => targetIds.has(Number(s.id)))
                  .map(s => ({
                    id: s.id,
                    dailyStatus: getDailyAttendanceStatus(s),
                    lateDetails: s.lateDetails || null,
                    status: s.status || 'present',
                    withStaff: s.withStaff || null,
                    classLog: s.classLog || [],
                  }))

                setUndoStack(u => [...u.slice(-9), { type: 'bulk', snapshot }])
                setStudents(prev => prev.map(s => (
                  targetIds.has(Number(s.id))
                    ? { ...s, dailyStatus: 'present', lateDetails: null, status: 'present', withStaff: null }
                    : s
                )))
                const success = await persistStudentFieldsBulk(
                  filteredStudents.map(s => ({
                    id: s.id,
                    fields: {
                      dailyStatus: 'present',
                      lateDetails: null,
                      status: 'present',
                      withStaff: null,
                    }
                  }))
                )
                if (!success) {
                  setStudents(prev => prev.map(s => {
                    if (!targetIds.has(Number(s.id))) return s
                    const saved = snapshot.find(x => x.id === s.id)
                    return saved
                      ? {
                          ...s,
                          dailyStatus: saved.dailyStatus,
                          lateDetails: saved.lateDetails,
                          status: saved.status,
                          withStaff: saved.withStaff,
                          classLog: saved.classLog,
                        }
                      : s
                  }))
                  alert('Unable to save all attendance statuses to Supabase.')
                }
              }} style={{ ...S.btn('success'), padding: '5px 12px', fontSize: 12 }}>Mark All Present</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: collapsed ? 'repeat(auto-fit, minmax(180px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {students.map((s, i) => {
              const daily = getDailyAttendanceStatus(s)
              const colors = { present: '#56765f', absent: '#9f1239', late: '#9a6a2a', 'left-early': '#6d28d9', 'not-arrived': '#64748b', unconfirmed: '#94a3b8' }
              const labels = { present: 'Present', absent: 'Absent', late: 'Late', 'left-early': 'Left Early', 'not-arrived': 'Not Arrived', unconfirmed: 'Unconfirmed' }
              return (
                <div key={s.id} style={{ background: '#ffffff', border: `1px solid ${daily !== 'present' ? `${colors[daily] || '#94a3b8'}40` : '#e2e8f0'}`, borderLeft: `4px solid ${colors[daily] || '#94a3b8'}`, borderRadius: 10, padding: collapsed ? '10px 12px' : '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: collapsed ? 0 : 8 }}>
                    <div style={S.avatar(i, 30)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: colors[daily] || '#94a3b8', fontWeight: 600 }}>{labels[daily] || 'Unconfirmed'}</div>
                      {daily === 'late' && s.lateDetails?.timeArrived && (
                        <div style={{ fontSize: 10, color: '#64748b' }}>⏰ {s.lateDetails.timeArrived}{s.lateDetails.note ? ` · ${s.lateDetails.note}` : ''}</div>
                      )}
                    </div>
                  </div>
                  {!collapsed && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {[['present','Present'],['absent','Absent'],['late','Late'],['left-early','Left Early']].map(([val, label]) => (
                        <button key={val} onClick={() => updateDailyStatus(s.id, val)}
                          style={{ padding: '4px 6px', borderRadius: 5, border: `1px solid ${daily === val ? colors[val] : '#e5e7eb'}`, background: daily === val ? colors[val] + '20' : '#fff', color: daily === val ? colors[val] : '#64748b', fontSize: 10, fontWeight: daily === val ? 700 : 400, cursor: 'pointer' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {dailyView === 'class' && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 16 }}>
            {[
              ['In Class', filteredStudents.filter(s => isInClassroom(s)).length, '#56765f'],
              ['Out of School', filteredStudents.filter(s => isOutOfSchool(s)).length, '#9f1239'],
              ['Late Today', filteredStudents.filter(s => getDailyAttendanceStatus(s) === 'late').length, '#9a6a2a'],
              ['Therapy', filteredStudents.filter(s => s.status === 'therapy').length, '#6d28d9'],
              ['With BT', filteredStudents.filter(s => s.status === 'with-bt').length, '#3f6b76'],
              ['Unknown', filteredStudents.filter(s => isLocationUnknown(s)).length, '#9f1239'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '10px 6px', border: `1px solid ${(val) > 0 ? color + '30' : '#e2e8f0'}` }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (val) > 0 ? color : '#94a3b8' }}>{val}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Live Class Toggle</div>
            <button onClick={async () => {
              const targetIds = new Set(filteredStudents.map(s => Number(s.id)))
              if (targetIds.size === 0) return

              const snapshot = students.map(s => ({ ...s }))
              setStudents(prev => prev.map(s => (
                targetIds.has(Number(s.id))
                  ? { ...s, status: 'present', withStaff: null }
                  : s
              )))
              const success = await persistStudentFieldsBulk(
                filteredStudents.map(s => ({
                  id: s.id,
                  fields: { status: 'present', withStaff: null }
                }))
              )
              if (!success) {
                setStudents(snapshot)
                alert('Unable to save all student statuses to Supabase.')
              }
            }} style={{ ...S.btn('success'), padding: '5px 12px', fontSize: 12 }}>Mark All Present</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {filteredStudents.map((s, i) => {
              const inClass = isInClassroom(s)
              const outOfSchool = isOutOfSchool(s)
              const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
              return (
                <div key={s.id} style={{ background:
                    outOfSchool
                      ? '#cbd5e1'
                      : s.status === 'unknown'
                        ? '#fee2e2'
                        : s.status === 'therapy'
                          ? '#f3e8ff'
                          : s.status === 'with-bt'
                            ? '#e0f2fe'
                            : inClass
                              ? '#f0fdf4'
                              : '#f8fafc',
                  border: `2px solid ${
                    outOfSchool
                      ? '#94a3b8'
                      : s.status === 'unknown'
                        ? '#fca5a5'
                        : s.status === 'therapy'
                          ? '#c4b5fd'
                          : s.status === 'with-bt'
                            ? '#7dd3fc'
                            : inClass
                              ? '#86efac'
                              : '#e2e8f0'
                  }`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={S.avatar(i, 30)}>{initials(s.name)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      {withStaffObj && <div style={{ fontSize: 10, color: '#3f6b76', fontWeight: 600 }}>👤 {withStaffObj.name}</div>}
                      {!inClass && !withStaffObj && <div style={{ fontSize: 10, color: statusColor[s.status], fontWeight: 600 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: inClass ? '#4b6854' : '#9f1239', fontWeight: 600 }}>{inClass ? 'In Class' : 'Left Class'}</span>
                    <div onClick={() => (role !== 'therapist' || !inClass) && handleToggle(s)} style={{ width: 44, height: 24, borderRadius: 12, background: inClass ? '#56765f' : '#e5e7eb', position: 'relative', cursor: role !== 'therapist' || !inClass ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: inClass ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {dailyView === 'status-board' && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>Class-wide Live Status Board</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Live counts of In Class / Absent / Therapy / Unknown with quick class-level resolution.</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {CLASSES.map(cls => {
              const classStudents = students.filter(s => s?.is_active !== false && resolveStudentClassId(s) === cls.id)
              if (classStudents.length === 0) return null

              const inClassCount = classStudents.filter(s => isInClassroom(s)).length
              const absentCount = classStudents.filter(s => getDailyAttendanceStatus(s) === 'absent').length
              const therapyCount = classStudents.filter(s => s.status === 'therapy' || s.status === 'with-bt').length
              const unknownCount = classStudents.filter(s => isLocationUnknown(s)).length
              const flaggedCount = classStudents.filter(s => isLocationUnknown(s)).length

              return (
                <div key={cls.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{cls.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{cls.teacher}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: flaggedCount > 0 ? '#9f1239' : '#4b6854' }}>
                      {flaggedCount > 0 ? `${flaggedCount} flagged` : 'Clear'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
                    <div style={{ borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#166534' }}>{inClassCount}</div>
                      <div style={{ fontSize: 10, color: '#166534' }}>In Class</div>
                    </div>
                    <div style={{ borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#9f1239' }}>{absentCount}</div>
                      <div style={{ fontSize: 10, color: '#9f1239' }}>Absent</div>
                    </div>
                    <div style={{ borderRadius: 8, background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#6d28d9' }}>{therapyCount}</div>
                      <div style={{ fontSize: 10, color: '#6d28d9' }}>Therapy</div>
                    </div>
                    <div style={{ borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#9a3412' }}>{unknownCount}</div>
                      <div style={{ fontSize: 10, color: '#9a3412' }}>Unknown</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{classStudents.length} students total</div>
                    <button
                      onClick={() => resolveFlaggedStudentsForClass(cls.id)}
                      disabled={flaggedCount === 0}
                      style={{ ...S.btn(flaggedCount > 0 ? 'primary' : 'ghost'), padding: '6px 10px', fontSize: 11 }}
                    >
                      Mark Now
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {dailyView === 'weekly' && (
        <div style={S.card}>
          <WeeklyRecord
            students={students}
            filteredStudents={filteredStudents}
            openStudent={openStudent}
            S={S}
            initials={initials}
            DAYS={DAYS}
            CLASSES={CLASSES}
            HISTORICAL_DATA={HISTORICAL_DATA}
            isVIP={isVIP}
          />
        </div>
      )}
    </div>
  )
}

function WeeklyRecord({ students, filteredStudents, openStudent, S, initials, DAYS, CLASSES, HISTORICAL_DATA, isVIP }) {
  const [view, setView] = useState('daily')
  const dailyLabels = { 'P': 'P', 'A': 'A', 'L': 'L', 'LE': 'LE' }
  const dailyColors = {
    'P': ['#4b6854','#dcfce7'],
    'A': ['#9f1239','#fee2e2'],
    'L': ['#9a6a2a','#dbeafe'],
    'LE': ['#5b5f7a','#f5f3ff']
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>📊 Weekly Record</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setView('daily')} style={{ ...S.btn(view === 'daily' ? 'primary' : 'ghost'), padding: '5px 12px', fontSize: 12 }}>📅 Daily Attendance</button>
          <button onClick={() => setView('class')} style={{ ...S.btn(view === 'class' ? 'primary' : 'ghost'), padding: '5px 12px', fontSize: 12 }}>🏫 Class Attendance</button>
        </div>
      </div>

      {view === 'daily' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Student</th>
              {DAYS.map(d => <th key={d} style={{ padding: 8, textAlign: 'center' }}>{d}</th>)}
              <th style={{ padding: 8, textAlign: 'center' }}>P</th>
              <th style={{ padding: 8, textAlign: 'center' }}>A</th>
              <th style={{ padding: 8, textAlign: 'center' }}>L</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, i) => {
              const attendanceCodes = Array.isArray(s.att) ? s.att : []
              return (
                <tr key={s.id} onClick={() => openStudent(s)} style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={S.avatar(i, 26)}>{initials(s.name)}</div>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                      {(typeof isVIP === 'function' ? isVIP(s) : false) && <span style={{ fontSize: 10 }}>⭐</span>}
                    </div>
                  </td>
                  {attendanceCodes.map((d, j) => {
                    const [color, bg] = dailyColors[d] || dailyColors['P']
                    return (
                      <td key={j} style={{ padding: 8, textAlign: 'center' }}>
                        <span style={{ background: bg, color, padding: '2px 6px', borderRadius: 14, fontSize: 11, fontWeight: 600 }}>{d}</span>
                      </td>
                    )
                  })}
                  <td style={{ textAlign: 'center', padding: 8, fontWeight: 600 }}>{attendanceCodes.filter(d => d === 'P').length}</td>
                  <td style={{ textAlign: 'center', padding: 8, color: '#9f1239', fontWeight: 600 }}>{attendanceCodes.filter(d => d === 'A').length}</td>
                  <td style={{ textAlign: 'center', padding: 8, color: '#9a6a2a', fontWeight: 600 }}>{attendanceCodes.filter(d => d === 'L').length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {view === 'class' && (
        <div>
          {CLASSES.map(cls => {
            const clsStudents = filteredStudents.filter(s => s?.is_active !== false && resolveStudentClassId(s) === cls.id)
            if (clsStudents.length === 0) return null
            return (
              <div key={cls.id} style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 6 }}>
                  🏫 {cls.name} · {cls.teacher}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px' }}>Student</th>
                      {DAYS.map(d => <th key={d} style={{ padding: 6, textAlign: 'center' }}>{d}</th>)}
                      <th style={{ padding: 6, textAlign: 'center' }}>Avg %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clsStudents.map((s, i) => {
                      const histData = HISTORICAL_DATA[s.id] || []
                      const avgPct = histData.length > 0 ? Math.round(histData.reduce((acc, d) => acc + d.pct, 0) / histData.length) : null
                      return (
                        <tr key={s.id} onClick={() => openStudent(s, 'tracking')} style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                          <td style={{ padding: '7px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={S.avatar(i, 24)}>{initials(s.name)}</div>
                              <span style={{ fontWeight: 500 }}>{s.name}</span>
                            </div>
                          </td>
                          {DAYS.map((d, j) => {
                            const dayData = histData.find(h => new Date(h.date).getDay() === j)
                            return (
                              <td key={j} style={{ padding: 6, textAlign: 'center' }}>
                                {dayData ? (
                                  <span style={{ background: dayData.pct >= 70 ? '#dcfce7' : dayData.pct >= 50 ? '#fef3c7' : '#fee2e2', color: dayData.pct >= 70 ? '#4b6854' : dayData.pct >= 50 ? '#92400e' : '#9f1239', padding: '2px 5px', borderRadius: 14, fontSize: 10, fontWeight: 600 }}>{dayData.pct}%</span>
                                ) : <span style={{ color: '#d1d5db', fontSize: 10 }}>—</span>}
                              </td>
                            )
                          })}
                          <td style={{ textAlign: 'center', padding: 6 }}>
                            {avgPct !== null ? (
                              <span style={{ fontWeight: 700, fontSize: 12, color: avgPct >= 70 ? '#56765f' : avgPct >= 50 ? '#9a6a2a' : '#9f1239' }}>{avgPct}%</span>
                            ) : <span style={{ color: '#94a3b8', fontSize: 10 }}>No data</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
