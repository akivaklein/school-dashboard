export default function AttendanceReportsPanel({
  S,
  rows,
  attendanceReportOpen,
  setAttendanceReportOpen,
  attendanceReportView,
  setAttendanceReportView,
  attendanceReportDivision,
  setAttendanceReportDivision,
  attendanceReportClass,
  setAttendanceReportClass,
  attendanceReportStatus,
  setAttendanceReportStatus,
  attendanceReportStudentId,
  setAttendanceReportStudentId,
  attendanceReportSearch,
  setAttendanceReportSearch,
  openAttendanceReportWindow,
}) {
  const classOptions = [...new Set(rows.map(s => s.className).filter(Boolean))]
  const filteredRows = rows.filter(s => {
    const matchesDivision = attendanceReportDivision === 'all' || s.division === attendanceReportDivision
    const matchesClass = attendanceReportClass === 'all' || s.className === attendanceReportClass
    const matchesStudent = attendanceReportStudentId === 'all' || String(s.id) === String(attendanceReportStudentId)
    const q = attendanceReportSearch.trim().toLowerCase()
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || (s.className || '').toLowerCase().includes(q)

    let matchesStatus = true
    if (attendanceReportStatus !== 'all') {
      if (attendanceReportView === 'student') {
        matchesStatus = s.history.some(h => h.status === attendanceReportStatus)
      } else {
        matchesStatus = s.lastStatus === attendanceReportStatus
      }
    }

    return matchesDivision && matchesClass && matchesStudent && matchesSearch && matchesStatus
  })

  const presentToday = rows.filter(s => ['present', 'late', 'left-early'].includes(s.lastStatus)).length
  const absentToday = rows.filter(s => s.lastStatus === 'absent').length
  const lateToday = rows.filter(s => s.lastStatus === 'late').length
  const leftEarlyToday = rows.filter(s => s.lastStatus === 'left-early').length
  const selectedReportStudent = rows.find(s => String(s.id) === String(attendanceReportStudentId))

  return (
    <details open={attendanceReportOpen} onToggle={e => setAttendanceReportOpen(e.currentTarget.open)} style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
      <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#172033' }}>Attendance Reports</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Click to generate reports by student, class, division, status, or last 7 school days.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ padding: '8px 12px', borderRadius: 999, background: '#eef4f0', border: '1px solid #b9d7c2', fontSize: 12, fontWeight: 800, color: '#20462b' }}>Present: {presentToday}</span>
          <span style={{ padding: '8px 12px', borderRadius: 999, background: '#fff1f2', border: '1px solid #fecdd3', fontSize: 12, fontWeight: 800, color: '#9f1239' }}>Absent: {absentToday}</span>
          <span style={{ padding: '8px 12px', borderRadius: 999, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, fontWeight: 800, color: '#9a3412' }}>Late: {lateToday}</span>
          <span style={{ padding: '8px 12px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 800, color: '#475569' }}>Left Early: {leftEarlyToday}</span>
        </div>
      </summary>

      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
          <button onClick={() => setAttendanceReportView('today')} style={attendanceReportView === 'today' ? S.btn('primary') : S.btn('ghost')}>Today</button>
          <button onClick={() => setAttendanceReportView('last7')} style={attendanceReportView === 'last7' ? S.btn('primary') : S.btn('ghost')}>Last 7 Days</button>
          <button onClick={() => setAttendanceReportView('student')} style={attendanceReportView === 'student' ? S.btn('primary') : S.btn('ghost')}>Student History</button>
          <button onClick={() => { setAttendanceReportStatus('absent'); setAttendanceReportView('today') }} style={attendanceReportStatus === 'absent' ? S.btn('primary') : S.btn('ghost')}>Absent</button>
          <button onClick={() => { setAttendanceReportStatus('late'); setAttendanceReportView('today') }} style={attendanceReportStatus === 'late' ? S.btn('primary') : S.btn('ghost')}>Late</button>
          <button onClick={() => { setAttendanceReportStatus('left-early'); setAttendanceReportView('today') }} style={attendanceReportStatus === 'left-early' ? S.btn('primary') : S.btn('ghost')}>Left Early</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr 1.2fr', gap: 10, marginBottom: 14 }}>
          <input value={attendanceReportSearch} onChange={e => setAttendanceReportSearch(e.target.value)} placeholder="Search student or class..." style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 13 }} />

          <select value={attendanceReportDivision} onChange={e => setAttendanceReportDivision(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 13 }}>
            <option value="all">All divisions</option>
            <option value="yeshiva_ketana">Yeshiva Ketana</option>
          </select>

          <select value={attendanceReportClass} onChange={e => setAttendanceReportClass(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 13 }}>
            <option value="all">All classes</option>
            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={attendanceReportStatus} onChange={e => setAttendanceReportStatus(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 13 }}>
            <option value="all">All statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="left-early">Left early</option>
          </select>

          <select value={attendanceReportStudentId} onChange={e => { setAttendanceReportStudentId(e.target.value); if (e.target.value !== 'all') setAttendanceReportView('student') }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 13 }}>
            <option value="all">All students</option>
            {rows.map(stu => <option key={stu.id} value={stu.id}>{stu.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#475569' }}>
            Showing <b>{filteredRows.length}</b> students · View: <b>{attendanceReportView === 'last7' ? 'Last 7 school days' : attendanceReportView === 'student' ? 'Student history' : 'Today'}</b>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setAttendanceReportDivision('all'); setAttendanceReportClass('all'); setAttendanceReportStatus('all'); setAttendanceReportStudentId('all'); setAttendanceReportSearch(''); setAttendanceReportView('today') }} style={S.btn('ghost')}>Clear Filters</button>
            <button onClick={() => openAttendanceReportWindow({
              rows: filteredRows,
              view: attendanceReportView,
              selectedStudent: selectedReportStudent,
              filters: {
                division: attendanceReportDivision === 'all' ? 'All divisions' : attendanceReportDivision,
                className: attendanceReportClass === 'all' ? 'All classes' : attendanceReportClass,
                status: attendanceReportStatus === 'all' ? 'All statuses' : attendanceReportStatus,
                search: attendanceReportSearch,
              },
            })} style={S.btn('primary')}>Generate Report</button>
          </div>
        </div>

        {attendanceReportView === 'student' && selectedReportStudent && (
          <div style={{ marginBottom: 14, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#172033', marginBottom: 8 }}>{selectedReportStudent.name} Attendance History</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
              <div><b>{selectedReportStudent.cameToYeshivaDays}</b><br/><span style={{ fontSize: 11, color: '#64748b' }}>Came to yeshiva</span></div>
              <div><b>{selectedReportStudent.absentDays}</b><br/><span style={{ fontSize: 11, color: '#64748b' }}>Absent</span></div>
              <div><b>{selectedReportStudent.lateDays}</b><br/><span style={{ fontSize: 11, color: '#64748b' }}>Late</span></div>
              <div><b>{selectedReportStudent.leftEarlyDays}</b><br/><span style={{ fontSize: 11, color: '#64748b' }}>Left early</span></div>
            </div>
            {selectedReportStudent.history.map(day => (
              <div key={day.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 10, padding: '8px 0', borderTop: '1px solid #e2e8f0', fontSize: 13 }}>
                <div>{day.label}</div>
                <div style={{ fontWeight: 800, color: day.status === 'absent' ? '#9f1239' : day.status === 'late' ? '#9a3412' : day.status === 'left-early' ? '#475569' : '#166534' }}>{day.status}</div>
                <div>{day.arrived || day.left || '—'}</div>
                <div style={{ color: '#64748b' }}>{day.note}</div>
              </div>
            ))}
          </div>
        )}

        {attendanceReportView !== 'student' && (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Student</th>
                  <th style={{ padding: 10 }}>Division</th>
                  <th style={{ padding: 10 }}>Class</th>
                  <th style={{ padding: 10 }}>Today</th>
                  <th style={{ padding: 10 }}>Came Last 7</th>
                  <th style={{ padding: 10 }}>Absent</th>
                  <th style={{ padding: 10 }}>Late</th>
                  <th style={{ padding: 10 }}>Left Early</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(stu => (
                  <tr key={stu.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 10, fontWeight: 800 }}>{stu.name}</td>
                    <td style={{ padding: 10 }}>Yeshiva Ketana</td>
                    <td style={{ padding: 10 }}>{stu.className}</td>
                    <td style={{ padding: 10, fontWeight: 800 }}>{stu.lastStatus}</td>
                    <td style={{ padding: 10 }}>{stu.cameToYeshivaDays}/7</td>
                    <td style={{ padding: 10 }}>{stu.absentDays}</td>
                    <td style={{ padding: 10 }}>{stu.lateDays}</td>
                    <td style={{ padding: 10 }}>{stu.leftEarlyDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  )
}
