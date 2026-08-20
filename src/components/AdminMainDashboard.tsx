import {
  cameToSchoolToday,
  getDailyAttendanceStatus,
  isInClassroom,
  isInSchool,
} from '../utils/attendancePresence'
import { formatUnknownDuration } from '../utils/unknownLocationTimer'
import { resolveStudentClassId } from './dashboardData'

export default function AdminMainDashboard({
  S,
  getGreeting,
  userName,
  total,
  divisionLabel,
  divisionView,
  LiveClock,
  cameToday,
  stillInYeshiva,
  unknown,
  urgentStudents,
  setShowUnknownPopup,
  userAccess,
  divisionSummaries,
  DIVISIONS,
  inClassrooms,
  inClassroomsStudents,
  late,
  lateStudents,
  inTherapy,
  withBT,
  students,
  leftEarlyStudents,
  absentTodayStudents,
  setDrillDown,
  cameTodayRate,
  setPage,
  callsDueStudents,
  alerts,
  openStudent,
  studentFlags,
  setSupportInitialSection,
  CLASSES,
  STUDENT_CLASSES,
  improved,
  needsAttention,
  vipStudents,
  getImprovement,
  initials,
  todos,
  setTodos,
  FlagDashboardWidget,
}) {
  const matchesTodo = (candidate, target) => (
    candidate === target || (
      candidate.id === target.id
      && candidate.date === target.date
      && candidate.time === target.time
      && candidate.text === target.text
      && candidate.category === target.category
    )
  )

  const inSchoolNowStudents = students.filter(s => isInSchool(s))
  const unknownStudents = students.filter(s => s.status === 'unknown')
  const knownLocationCount = Math.max(total - unknown, 0)
  const accountedForPct = total > 0 ? Math.round((knownLocationCount / total) * 100) : 0
  const knownLocationAngle = total > 0 ? (knownLocationCount / total) * 360 : 0
  const priorityDangerAlerts = alerts.filter(a => a.type === 'danger' && !a.msg.includes('Location unknown'))

  const classLabelById = Object.fromEntries((CLASSES || []).map(cls => [cls.id, cls.name]))

  const unknownLocationRows = unknownStudents.map(student => ({
    student,
    unknownDuration: formatUnknownDuration(student.unknownSince),
    lastKnownLocation: student.lastKnownLocation || 'Not recorded',
    lastKnownTime: student.lastKnownTime || 'Not recorded',
    expectedCurrentLocation: classLabelById[resolveStudentClassId(student)] || 'Class assignment',
  }))

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <div style={{ marginBottom: 26, background: '#ffffff', borderRadius: 14, padding: '26px 28px', color: '#1f2937', boxShadow: '0 10px 28px rgba(15,23,42,0.045)', border: '1px solid #e4e9f0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: -90, width: 240, height: 240, borderRadius: '50%', background: 'rgba(148,163,184,0.08)' }} />
        <div style={{ position: 'absolute', right: 70, bottom: -90, width: 180, height: 180, borderRadius: '50%', background: 'rgba(148,163,184,0.08)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', marginBottom: 10 }}>Yeshiva Ketana Command Center</div>
            <h1 style={{ fontSize: 31, fontWeight: 700, margin: 0, letterSpacing: '-0.045em', color: '#111827' }}>{getGreeting(new Date().getHours())}, {userName}</h1>
            <p style={{ color: '#64748b', margin: '9px 0 0', fontSize: 13 }}><LiveClock /> · {total} students shown · {divisionLabel(divisionView)}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 92px)', gap: 10 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e4e9f0', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 700 }}>{cameToday}</div><div style={{ fontSize: 10, color: '#64748b' }}>Came Today</div></div>
            <div style={{ background: '#f8fafc', border: '1px solid #e4e9f0', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 700 }}>{stillInYeshiva}</div><div style={{ fontSize: 10, color: '#64748b' }}>In Building</div></div>
            <div style={{ background: unknown > 0 ? '#fdf2f2' : '#f8fafc', border: '1px solid #e4e9f0', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 700 }}>{urgentStudents.length}</div><div style={{ fontSize: 10, color: '#64748b' }}>Urgent</div></div>
          </div>
        </div>
      </div>
      {divisionView === 'all' && userAccess.divisions.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
          {divisionSummaries.map(summary => (
            <div key={summary.key} style={{ ...S.card, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#263241' }}>{summary.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{summary.students.length} students in this division</div>
                </div>
                <span style={{ ...S.badge('#475569', '#f1f5f9') }}>{DIVISIONS[summary.key]?.shortLabel}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#263241' }}>{summary.inBuilding}</div><div style={{ fontSize: 10, color: '#64748b' }}>In</div></div>
                <div style={{ background: summary.unknown ? '#fff7f7' : '#f8fafc', borderRadius: 10, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: summary.unknown ? '#9f1239' : '#263241' }}>{summary.unknown}</div><div style={{ fontSize: 10, color: '#64748b' }}>Unknown</div></div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#263241' }}>{summary.absent}</div><div style={{ fontSize: 10, color: '#64748b' }}>Absent</div></div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#263241' }}>{summary.late}</div><div style={{ fontSize: 10, color: '#64748b' }}>Late</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {unknown > 0 && (
        <div style={{ background: '#fff7f7', border: '1px solid #ffd1d1', borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, boxShadow: '0 12px 32px rgba(185,28,28,0.06)' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#9f1239', fontSize: 15 }}>{unknown} student{unknown > 1 ? 's' : ''} with unknown location</div>
            <div style={{ fontSize: 12, color: '#991b1b', marginTop: 3 }}>Please locate immediately and update the student status.</div>
          </div>
          <button onClick={() => setShowUnknownPopup(true)} style={{ ...S.btn('danger'), padding: '9px 18px', fontSize: 13, flexShrink: 0 }}>Update locations</button>
        </div>
      )}

      <div style={{ ...S.card, borderRadius: 12, padding: 22, marginBottom: 20, boxShadow: '0 8px 22px rgba(15,23,42,0.045)' }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 19, color: '#102a43', fontWeight: 800 }}>Live Status</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Current school movement and location visibility</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 20, alignItems: 'stretch' }}>
          <div style={{ border: '1px solid #d7e1ec', borderRadius: 12, background: '#f8fafc', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', background: `conic-gradient(#3f6f9f 0 ${knownLocationAngle}deg, #e8eef5 ${knownLocationAngle}deg 360deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 102, height: 102, borderRadius: '50%', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#102a43', lineHeight: 1 }}>{accountedForPct}%</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontWeight: 700 }}>Accounted For</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#475569', fontWeight: 700 }}>{knownLocationCount} of {total} students</div>
          </div>

          <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {[
              { label: 'In School Now', val: stillInYeshiva, accent: '#5b7ea5', border: '#dbe4ef', filter: inSchoolNowStudents },
              { label: 'In Classrooms', val: inClassrooms, accent: '#5b7ea5', border: '#dbe4ef', filter: inClassroomsStudents },
              { label: 'Unknown Location', val: unknown, accent: '#5b7ea5', border: '#dbe4ef', unknownAction: true, filter: unknownStudents },
            ].map(item => (
              <div
                key={item.label}
                onClick={() => item.unknownAction ? setShowUnknownPopup(true) : setDrillDown({ title: item.label, students: item.filter })}
                style={{ border: `1px solid ${item.border}`, borderRadius: 10, background: '#ffffff', padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#243b53', fontWeight: 700 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.accent, flexShrink: 0 }} />
                  <span>{item.label}</span>
                </div>
                <div style={{ fontSize: 27, fontWeight: 800, color: '#102a43', lineHeight: 1 }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...S.card, borderRadius: 12, padding: 20, marginBottom: 24, border: unknown > 0 ? '1px solid #fecdd3' : '1px solid #e2e8f0', boxShadow: unknown > 0 ? '0 10px 26px rgba(190,24,93,0.08)' : '0 8px 20px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 17, color: '#102a43', fontWeight: 800 }}>Unknown Location</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Students currently flagged with unknown whereabouts</div>
          </div>
          <button onClick={() => setShowUnknownPopup(true)} style={unknown > 0 ? { ...S.btn('danger'), padding: '8px 12px', fontSize: 12 } : { ...S.btn('ghost'), padding: '8px 12px', fontSize: 12 }}>
            Update Locations
          </button>
        </div>

        {unknownLocationRows.length === 0 ? (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 12px', fontSize: 13, color: '#64748b', background: '#f8fafc' }}>
            No students with unknown location right now.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 11, color: '#334155', fontWeight: 800, padding: '10px 10px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>Student</th>
                  <th style={{ textAlign: 'left', fontSize: 11, color: '#334155', fontWeight: 800, padding: '10px 10px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>Unknown Duration</th>
                  <th style={{ textAlign: 'left', fontSize: 11, color: '#334155', fontWeight: 800, padding: '10px 10px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>Last Known Location</th>
                  <th style={{ textAlign: 'left', fontSize: 11, color: '#334155', fontWeight: 800, padding: '10px 10px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>Last Known Time</th>
                  <th style={{ textAlign: 'left', fontSize: 11, color: '#334155', fontWeight: 800, padding: '10px 10px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>Expected Current Location</th>
                </tr>
              </thead>
              <tbody>
                {unknownLocationRows.map((row, index) => (
                  <tr key={row.student.id} onClick={() => openStudent(row.student)} style={{ cursor: 'pointer', background: index % 2 === 0 ? '#ffffff' : '#fbfdff' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef2f7', fontSize: 13, color: '#172033', fontWeight: 700 }}>{row.student.name}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef2f7', fontSize: 12, color: '#9f1239', fontWeight: 700 }}>{row.unknownDuration}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef2f7', fontSize: 12, color: '#334155' }}>{row.lastKnownLocation}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef2f7', fontSize: 12, color: '#334155' }}>{row.lastKnownTime}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef2f7', fontSize: 12, color: '#334155' }}>{row.expectedCurrentLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.12fr 0.88fr', gap: 22, marginBottom: 26 }}>
        <div style={{ ...S.card, borderRadius: 16, padding: 24, minHeight: 310, boxShadow: '0 10px 28px rgba(15,23,42,0.045)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, color: '#102a43', fontWeight: 800 }}>Attendance Today</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Daily attendance and building presence snapshot</div>
            </div>
            <button onClick={() => setPage('attendance')} style={{ background: '#3f6f9f', color: '#ffffff', border: 'none', borderRadius: 10, padding: '8px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Open Attendance</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: '#102a43', letterSpacing: '-0.04em' }}>{cameToday}</div>
                <div style={{ fontSize: 13, color: '#475569' }}>/ {total} came today</div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>{total} boys enrolled total</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#102a43' }}>{stillInYeshiva}</div>
                <div style={{ fontSize: 13, color: '#475569' }}>still in school now</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { label: 'Came Today', val: cameToday, accent: '#2f855a', filter: students.filter(s => cameToSchoolToday(s)) },
                  { label: 'Absent', val: absentTodayStudents.length, accent: '#9f1239', filter: absentTodayStudents },
                  { label: 'Late', val: late, accent: '#a16207', filter: lateStudents },
                  { label: 'Left Early', val: leftEarlyStudents.length, accent: '#a16207', filter: leftEarlyStudents },
                  { label: 'Still in School', val: stillInYeshiva, accent: '#5b7ea5', filter: inSchoolNowStudents },
                ].map(x => (
                  <div key={x.label} onClick={() => setDrillDown({ title: x.label, students: x.filter })} style={{ background: '#ffffff', border: '1px solid #dbe4ef', borderRadius: 12, padding: '10px 10px', cursor: 'pointer' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#102a43' }}>{x.val}</div>
                    <div style={{ fontSize: 11, color: '#334155', marginTop: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: x.accent, flexShrink: 0 }} />
                      <span>{x.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 144, height: 144, borderRadius: '50%', background: `conic-gradient(#1e293b 0 ${cameToday / total * 360}deg, #edf0f7 ${cameToday / total * 360}deg 360deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
              <div style={{ width: 98, height: 98, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#102a43' }}>{cameTodayRate}%</div>
                <div style={{ fontSize: 11, color: '#475569' }}>came today</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...S.card, borderRadius: 16, padding: 24, minHeight: 268, boxShadow: '0 10px 28px rgba(15,23,42,0.045)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 17, color: '#102a43', fontWeight: 800 }}>Priority Work</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>The few things that need attention</div>
            </div>
            <button onClick={() => setPage('alerts')} style={{ background: 'transparent', color: '#4f6687', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View all</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div onClick={() => setPage('alerts')} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9f1239' }} />
                <div style={{ fontSize: 30, fontWeight: 800, color: '#102a43' }}>{priorityDangerAlerts.length}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#263241', marginTop: 6 }}>Urgent alerts</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>excluding unknown-location list</div>
            </div>
            <div onClick={() => setPage('calls')} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a16207' }} />
                <div style={{ fontSize: 28, fontWeight: 700, color: '#102a43' }}>{callsDueStudents.length}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#263241', marginTop: 6 }}>Calls needed</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>parent follow-ups</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {priorityDangerAlerts.slice(0, 3).map((a, i) => (
              <div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: i === 0 ? '1px solid #f0f1f6' : 'none', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#263241' }}>{a.student}</div>
                  <div style={{ fontSize: 11, color: '#9f1239', marginTop: 2 }}>{a.msg.replace('❓ ', '').replace(' — please locate immediately!', '')}</div>
                </div>
                <div style={{ fontSize: 11, color: '#4f6687', fontWeight: 700 }}>Open</div>
              </div>
            ))}
            {priorityDangerAlerts.length === 0 && <div style={{ color: '#64748b', fontSize: 12, paddingTop: 8 }}>No urgent non-location alerts right now.</div>}
          </div>

          <FlagDashboardWidget
            flags={studentFlags}
            onOpen={() => {
              setSupportInitialSection('flags')
              setPage('support')
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginBottom: 26 }}>
        <div style={{ ...S.card, borderRadius: 16, padding: 24, boxShadow: '0 10px 28px rgba(15,23,42,0.045)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, color: '#263241', fontWeight: 700 }}>Classes</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Large class cards with quick status counts</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {CLASSES.map(cls => {
              const clsStudents = students.filter(s => s?.is_active !== false && resolveStudentClassId(s) === cls.id)
              const clsPresent = clsStudents.filter(s => isInClassroom(s)).length
              const clsAbsent = clsStudents.filter(s => getDailyAttendanceStatus(s) === 'absent').length
              const clsOut = clsStudents.filter(s => !isInClassroom(s) && isInSchool(s)).length
              const clsPct = Math.round(clsPresent / clsStudents.length * 100)
              return (
                <div key={cls.id} onClick={() => setDrillDown({ title: `${cls.name} — All Students`, students: clsStudents })} style={{ background: '#f8fafc', border: '1px solid #eef0f7', borderRadius: 14, padding: 20, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#263241' }}>{cls.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{cls.grade} · {cls.teacher}</div>
                      <div style={{ fontSize: 11, color: '#4f6687', fontWeight: 700, marginTop: 7 }}>{clsPct}% currently in</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 700, color: '#263241' }}>{clsStudents.length}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>students</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 18, height: 6, background: '#edf0f7', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${clsPct}%`, height: '100%', background: '#1e293b', borderRadius: 99 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
                    <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `${cls.name} — Present`, students: clsStudents.filter(s => isInClassroom(s)) }) }}>
                      <div style={{ fontSize: 18, color: '#263241', fontWeight: 700 }}>{clsPresent}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Present</div>
                    </div>
                    <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `${cls.name} — Absent`, students: clsStudents.filter(s => getDailyAttendanceStatus(s) === 'absent') }) }}>
                      <div style={{ fontSize: 18, color: '#9f1239', fontWeight: 700 }}>{clsAbsent}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Absent</div>
                    </div>
                    <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `${cls.name} — Out`, students: clsStudents.filter(s => !isInClassroom(s) && isInSchool(s)) }) }}>
                      <div style={{ fontSize: 18, color: '#9a6a2a', fontWeight: 700 }}>{clsOut}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Out</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ ...S.card, borderRadius: 16, padding: 24, boxShadow: '0 10px 28px rgba(15,23,42,0.045)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, color: '#263241', fontWeight: 700 }}>Weekly Progress</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Behavior trends</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
            <div onClick={() => setDrillDown({ title: 'Improved', students: students.filter(s => s.reminders < s.lastWeekReminders) })} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#102a43' }}>{improved}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2f855a' }} />Improved</div>
            </div>
            <div onClick={() => setDrillDown({ title: 'Needs Attention', students: students.filter(s => s.reminders > s.lastWeekReminders) })} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#102a43' }}>{needsAttention}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9f1239' }} />Attention</div>
            </div>
            <div onClick={() => setDrillDown({ title: 'VIP', students: vipStudents })} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#102a43' }}>{vipStudents.length}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a16207' }} />VIP</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {students.filter(s => s.reminders >= 4 || s.reminders > s.lastWeekReminders).slice(0, 5).map((s, i) => {
              const imp = getImprovement(s)
              return (
                <div key={s.id} onClick={() => openStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i === 0 ? '1px solid #f0f1f6' : 'none', cursor: 'pointer' }}>
                  <div style={S.avatar(i, 28)}>{initials(s.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#263241' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{imp.label}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: imp.color }}>{s.reminders}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ ...S.card, borderRadius: 16, padding: 24, boxShadow: '0 10px 28px rgba(15,23,42,0.045)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, color: '#263241', fontWeight: 700 }}>Today’s To-Do</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>A cleaner work queue instead of several small widgets</div>
          </div>
          <button onClick={() => setPage('todo')} style={{ background: '#eef4ff', color: '#4f6687', border: 'none', borderRadius: 14, padding: '7px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View all</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {todos.filter(t => !t.done).slice(0, 6).map(todo => (
            <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: '#f8fafc', borderRadius: 14, border: '1px solid #eef0f7' }}>
              <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => matchesTodo(t, todo) ? { ...t, done: true } : t))} style={{ marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 750, color: '#263241' }}>{todo.text}</div>
                {todo.time && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{todo.time}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
