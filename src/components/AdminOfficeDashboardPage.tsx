export default function AdminOfficeDashboardPage(props: any) {
  const {
    S,
    getGreeting,
    userName,
    LiveClock,
    setPage,
    setIntakeSection,
    storeItems,
    openStudent,
    intakeList,
    preIntakeList,
    callsDueStudents,
    alerts,
    students,
    setDrillDown,
    setShowUnknownPopup,
    divisionLabel,
    divisionView,
    divisionSummaries,
    DIVISIONS,
    inClassrooms,
    inClassroomsStudents,
    late,
    lateStudents,
    inTherapy,
    withBT,
    leftEarlyStudents,
    absentTodayStudents,
    cameTodayRate,
    cameToday,
    stillInYeshiva,
    unknown,
    urgentStudents,
    userAccess,
  } = props

  const docKeys = ['applicationForm','birthCertificate','immunization','iepEvaluation','reportCard','schoolRecords','parentQuestionnaire','tuitionPaperwork','emergencyContacts','medicalAllergies']
  const applicants = intakeList || []
  const preLeads = preIntakeList || []

  const accepted = applicants.filter((x: any) => ['Accepted','Accepted with supports','accepted','enrolled'].includes(x.decision || x.status))
  const missingDocApplicants = applicants.filter((x: any) => docKeys.some(k => !x.requiredDocsComplete?.[k]))
  const openFollowUps = applicants.flatMap((x: any) => (x.followUps || []).filter((t: any) => !t.done).map((t: any) => ({ ...t, applicant: x.name })))
  const tours = [
    ...preLeads.filter((x: any) => x.tourDate).map((x: any) => ({ name: x.name, date: x.tourDate, time: x.tourTime, by: x.tourBy || 'Rabbi Baum', type: 'Lead' })),
    ...applicants.filter((x: any) => x.tourDate).map((x: any) => ({ name: x.name, date: x.tourDate, time: x.tourTime, by: x.tourBy || 'Rabbi Baum', type: 'Applicant' }))
  ].slice(0, 6)

  const documentsNeeded = missingDocApplicants.reduce((sum: number, x: any) => sum + docKeys.filter(k => !x.requiredDocsComplete?.[k]).length, 0)
  const callsDue = callsDueStudents.slice(0, 5)

  function ClickCard({ label, val, color, sub, filterStudents, goToPage = null }: any) {
    return (
      <div onClick={() => { if (goToPage) setPage(goToPage); else if (filterStudents) setDrillDown({ title: label, students: filterStudents }) }}
        style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}`, boxShadow: '0 7px 18px rgba(30,41,59,0.045)', cursor: (filterStudents || goToPage) ? 'pointer' : 'default', transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={(e: any) => { if (filterStudents || goToPage) { e.currentTarget.style.boxShadow = '0 12px 28px rgba(30,41,59,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
        onMouseLeave={(e: any) => { e.currentTarget.style.boxShadow = '0 7px 18px rgba(30,41,59,0.045)'; e.currentTarget.style.transform = 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{label}</div>
          {(filterStudents || goToPage) && <span style={{ fontSize: 10, color: '#94a3b8' }}>click →</span>}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{sub}</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ marginBottom: 22, background: '#ffffff', borderRadius: 14, padding: '24px 26px', color: '#223046', boxShadow: '0 8px 22px rgba(30,41,59,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#708196', marginBottom: 9 }}>Office Command Desk</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.045em', color: '#111827' }}>{getGreeting(new Date().getHours())}, {userName}</h1>
            <p style={{ color: '#64748b', margin: '9px 0 0', fontSize: 13 }}><LiveClock /> · Admissions, calls, documents, and office follow-ups</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={() => { setPage('intake'); setIntakeSection('pre') }} style={S.btn('primary')}>Open Pre-Intake</button>
            <button onClick={() => { setPage('intake'); setIntakeSection('applicants') }} style={S.btn('ghost')}>Open Applicants</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        <ClickCard label="Pre-Intake Leads" val={preLeads.length} color="#334155" sub="calls, tours, early inquiries" goToPage="intake" />
        <ClickCard label="Applicants" val={applicants.length} color="#4f6687" sub={`${accepted.length} accepted/enrolled`} goToPage="intake" />
        <ClickCard label="Missing Docs" val={documentsNeeded} color="#9a3412" sub={`${missingDocApplicants.length} boys need paperwork`} goToPage="intake" />
        <ClickCard label="Open Follow-Ups" val={openFollowUps.length} color="#7c3aed" sub="office tasks still open" goToPage="intake" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, marginBottom: 18 }}>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#172033' }}>Admissions Office Work Queue</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>What the office should handle next.</div>
            </div>
            <button onClick={() => setPage('intake')} style={S.btn('ghost')}>Go to Intake</button>
          </div>

          {[
            { title: 'Collect missing documents', count: documentsNeeded, note: `${missingDocApplicants.length} applicants have incomplete packets`, page: 'intake' },
            { title: 'Follow up with parents', count: openFollowUps.length, note: 'open intake follow-up tasks', page: 'intake' },
            { title: 'Parent calls due', count: callsDueStudents.length, note: 'students needing parent contact', page: 'calls' },
            { title: 'Store low-stock review', count: storeItems.filter((i: any) => (i.stock || 0) <= (i.lowStockAt || 0)).length, note: 'canteen items below threshold', page: 'store' },
          ].map(item => (
            <div key={item.title} onClick={() => setPage(item.page)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 9, cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#172033' }}>{item.count}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.note}</div>
              </div>
              <div style={{ fontSize: 18, color: '#94a3b8' }}>›</div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 4 }}>Upcoming Tours</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Usually handled by Rabbi Baum or Rabbi Fried.</div>

          {tours.length === 0 && (
            <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', color: '#64748b', fontSize: 13 }}>No tours scheduled yet.</div>
          )}

          {tours.map((tour: any) => (
            <div key={`${tour.name}-${tour.date}-${tour.type}`} style={{ padding: '12px 0', borderBottom: '1px solid #eef2f7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>{tour.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{tour.type}</div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{tour.date}{tour.time ? ` · ${tour.time}` : ''} · {tour.by}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 10 }}>Open Intake Follow-Ups</div>
          {openFollowUps.slice(0, 6).map((task: any) => (
            <div key={`${task.applicant}-${task.id}`} style={{ padding: '10px 0', borderBottom: '1px solid #eef2f7' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{task.text}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{task.applicant} · Due {task.due || 'no date'} · {task.assigned || 'Office'}</div>
            </div>
          ))}
          {openFollowUps.length === 0 && <div style={{ fontSize: 13, color: '#64748b' }}>No open follow-ups. The office desk is sparkling.</div>}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 10 }}>Parent Calls Due</div>
          {callsDue.map((stu: any) => (
            <div key={stu.id} onClick={() => openStudent(stu, 'calls')} style={{ padding: '10px 0', borderBottom: '1px solid #eef2f7', cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{stu.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{stu.className} · parent call follow-up needed</div>
            </div>
          ))}
          {callsDue.length === 0 && <div style={{ fontSize: 13, color: '#64748b' }}>No parent calls due right now.</div>}
        </div>
      </div>
    </div>
  )
}
