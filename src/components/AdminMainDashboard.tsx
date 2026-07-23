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
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ marginBottom: 26, background: '#ffffff', borderRadius: 14, padding: '26px 28px', color: '#1f2937', boxShadow: '0 10px 28px rgba(15,23,42,0.045)', border: '1px solid #e4e9f0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: -90, width: 240, height: 240, borderRadius: '50%', background: 'rgba(148,163,184,0.08)' }} />
        <div style={{ position: 'absolute', right: 70, bottom: -90, width: 180, height: 180, borderRadius: '50%', background: 'rgba(148,163,184,0.08)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', marginBottom: 10 }}>Hadran Academy Command Center</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 24, marginBottom: 26 }}>
        <div style={{ ...S.card, borderRadius: 16, padding: 24, minHeight: 310, boxShadow: '0 10px 28px rgba(15,23,42,0.045)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, color: '#263241', fontWeight: 700 }}>Attendance</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Today’s attendance and live location summary</div>
            </div>
            <button onClick={() => setPage('attendance')} style={{ background: '#eef4ff', color: '#4f6687', border: 'none', borderRadius: 14, padding: '7px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Open Attendance</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
                <div style={{ fontSize: 38, fontWeight: 700, color: '#263241', letterSpacing: '-0.04em' }}>{cameToday}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>/ {total} came today</div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{total} boys enrolled total</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#263241' }}>{stillInYeshiva}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>still in yeshiva now</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'In classrooms', val: inClassrooms, color: '#263241', filter: inClassroomsStudents },
                  { label: 'Late', val: late, color: '#9a6a2a', filter: lateStudents },
                  { label: 'Therapy', val: inTherapy, color: '#4f6687', filter: students.filter(s => s.status === 'therapy') },
                  { label: 'With BT', val: withBT, color: '#4f7782', filter: students.filter(s => s.status === 'with-bt') },
                  { label: 'Unknown', val: unknown, color: '#9f1239', filter: students.filter(s => s.status === 'unknown'), unknownAction: true },
                  { label: 'Left early', val: leftEarlyStudents.length, color: '#64748b', filter: leftEarlyStudents },
                  { label: 'Absent', val: absentTodayStudents.length, color: '#9f1239', filter: absentTodayStudents },
                ].map(x => (
                  <div key={x.label} onClick={() => x.unknownAction ? setShowUnknownPopup(true) : setDrillDown({ title: x.label, students: x.filter })} style={{ background: x.unknownAction && x.val > 0 ? '#fff7f7' : '#f8fafc', border: `1px solid ${x.unknownAction && x.val > 0 ? '#fecaca' : '#eef0f7'}`, borderLeft: `3px solid ${x.color}`, borderRadius: 14, padding: '10px 12px', cursor: 'pointer' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: x.color }}>{x.val}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{x.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 144, height: 144, borderRadius: '50%', background: `conic-gradient(#1e293b 0 ${cameToday / total * 360}deg, #edf0f7 ${cameToday / total * 360}deg 360deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
              <div style={{ width: 98, height: 98, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#263241' }}>{cameTodayRate}%</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>came today</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...S.card, borderRadius: 16, padding: 24, minHeight: 268, boxShadow: '0 10px 28px rgba(15,23,42,0.045)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, color: '#263241', fontWeight: 700 }}>Priority Work</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>The few things that need attention</div>
            </div>
            <button onClick={() => setPage('alerts')} style={{ background: 'transparent', color: '#4f6687', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View all</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div onClick={() => setPage('alerts')} style={{ background: '#fff7f7', border: '1px solid #ffe0e0', borderRadius: 14, padding: 18, cursor: 'pointer' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#9f1239' }}>{urgentStudents.length}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#263241', marginTop: 6 }}>Urgent alerts</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>danger and warning items</div>
            </div>
            <div onClick={() => setPage('calls')} style={{ background: '#fffaf0', border: '1px solid #fdecc8', borderRadius: 14, padding: 18, cursor: 'pointer' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#9a6a2a' }}>{callsDueStudents.length}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#263241', marginTop: 6 }}>Calls needed</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>parent follow-ups</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.filter(a => a.type === 'danger').slice(0, 3).map((a, i) => (
              <div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: i === 0 ? '1px solid #f0f1f6' : 'none', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#263241' }}>{a.student}</div>
                  <div style={{ fontSize: 11, color: '#9f1239', marginTop: 2 }}>{a.msg.replace('❓ ', '').replace(' — please locate immediately!', '')}</div>
                </div>
                <div style={{ fontSize: 11, color: '#4f6687', fontWeight: 700 }}>Open</div>
              </div>
            ))}
            {alerts.filter(a => a.type === 'danger').length === 0 && <div style={{ color: '#64748b', fontSize: 12, paddingTop: 8 }}>No urgent alerts right now.</div>}
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
              const clsStudents = students.filter(s => STUDENT_CLASSES[s.id] === cls.id)
              const clsPresent = clsStudents.filter(s => s.status === 'present').length
              const clsAbsent = clsStudents.filter(s => s.status === 'absent').length
              const clsOut = clsStudents.filter(s => s.status !== 'present' && s.status !== 'absent').length
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
                    <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `${cls.name} — Present`, students: clsStudents.filter(s => s.status === 'present') }) }}>
                      <div style={{ fontSize: 18, color: '#263241', fontWeight: 700 }}>{clsPresent}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Present</div>
                    </div>
                    <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `${cls.name} — Absent`, students: clsStudents.filter(s => s.status === 'absent') }) }}>
                      <div style={{ fontSize: 18, color: '#9f1239', fontWeight: 700 }}>{clsAbsent}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Absent</div>
                    </div>
                    <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `${cls.name} — Out`, students: clsStudents.filter(s => s.status !== 'present' && s.status !== 'absent') }) }}>
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
            <div onClick={() => setDrillDown({ title: 'Improved', students: students.filter(s => s.reminders < s.lastWeekReminders) })} style={{ background: '#f4fbf7', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#56765f' }}>{improved}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Improved</div>
            </div>
            <div onClick={() => setDrillDown({ title: 'Needs Attention', students: students.filter(s => s.reminders > s.lastWeekReminders) })} style={{ background: '#fff7f7', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#9f1239' }}>{needsAttention}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Attention</div>
            </div>
            <div onClick={() => setDrillDown({ title: 'VIP', students: vipStudents })} style={{ background: '#fffaf0', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#9a6a2a' }}>{vipStudents.length}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>VIP</div>
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
              <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: true } : t))} style={{ marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
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
