import { useMemo } from 'react'

const INTAKE_ASSESSMENT_AREAS = [
  {
    section: 'Limudei Kodesh',
    helper: 'Core yeshiva readiness and classroom learning skills',
    items: [
      { label: 'Tefillah Participation', key: 'tefillah', icon: '🕍', detail: 'Follows along, participates, and stays focused during davening' },
      { label: 'Kriah Accuracy', key: 'kriah', icon: '📖', detail: 'Reads Hebrew with nekudos accurately, including siddur, Tehillim, and Chumash words' },
      { label: 'Gemara Text Reading', key: 'gemaraReading', icon: '📜', detail: 'Reads Gemara words clearly and fluently' },
      { label: 'Gemara Translation', key: 'gemaraTranslation', icon: '🔤', detail: 'Translates Gemara words, phrases, and common terms' },
      { label: 'Gemara Comprehension', key: 'gemaraComprehension', icon: '🧠', detail: 'Understands the flow of the sugya, questions, answers, and main ideas' },
      { label: 'Rashi Script', key: 'rashiScript', icon: '✒️', detail: 'Recognizes and reads Rashi letters' },
    ],
  },
  {
    section: 'General Studies',
    helper: 'Specific academic skills tested during the admissions review',
    items: [
      { label: 'Math: Addition', key: 'mathAddition', icon: '➕', detail: 'Single-digit, multi-digit, and regrouping skills' },
      { label: 'Math: Subtraction', key: 'mathSubtraction', icon: '➖', detail: 'Borrowing, regrouping, and multi-step accuracy' },
      { label: 'Math: Multiplication', key: 'mathMultiplication', icon: '✖️', detail: 'Facts, 2-digit multiplication, and computation fluency' },
      { label: 'Math: Division', key: 'mathDivision', icon: '➗', detail: 'Basic division, remainders, and long division readiness' },
      { label: 'English Reading Fluency', key: 'englishReading', icon: '📚', detail: 'Decoding, pacing, accuracy, and confidence while reading' },
      { label: 'Reading Comprehension', key: 'readingComprehension', icon: '🔎', detail: 'Understands passages, details, sequence, and main idea' },
      { label: 'Writing Skills', key: 'writingSkills', icon: '✍️', detail: 'Sentence structure, grammar, written response, and organization' },
      { label: 'Spelling / Vocabulary', key: 'spellingVocabulary', icon: '🔠', detail: 'Word recognition, spelling patterns, and vocabulary knowledge' },
    ],
  },
]

const INTAKE_PLACEMENT_LEVELS = [
  { key: 'foundational', label: 'Foundational', color: '#9a6a2a', bg: '#f7f1e8' },
  { key: 'developing', label: 'Developing', color: '#5b6f95', bg: '#edf2f7' },
  { key: 'independent', label: 'Independent', color: '#56765f', bg: '#eef4f0' },
]

const intakeScoreLabel = (val: number) => val === 0 ? '—' : val === 1 ? 'Needs Support' : val === 2 ? 'Emerging' : val === 3 ? 'Developing' : val === 4 ? 'Proficient' : 'Strong'
const intakeScoreColor = (val: number) => val >= 4 ? '#56765f' : val >= 3 ? '#5b6f95' : val > 0 ? '#9a6a2a' : '#94a3b8'

export default function IntakePage(props: any) {
  const {
    S,
    intakeSection,
    setIntakeSection,
    intakeList,
    setIntakeList,
    selectedIntake,
    setSelectedIntake,
    intakeTab,
    setIntakeTab,
    selectedPreIntake,
    setSelectedPreIntake,
    preIntakeList,
    setPreIntakeList,
    getAdmissionsReport,
    initials,
    divisionView,
    TOUR_STAFF_OPTIONS,
    setPage,
  } = props

  const admissionStages = useMemo(() => [
    { key: 'applicant', label: 'Applicant' },
    { key: 'tour-scheduled', label: 'Tour Scheduled' },
    { key: 'tour-completed', label: 'Tour Completed' },
    { key: 'interview-scheduled', label: 'Interview Scheduled' },
    { key: 'interviewed', label: 'Interviewed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'waitlist', label: 'Waitlist' },
    { key: 'needs-info', label: 'Needs Info' },
  ], [])

  const statusMeta = Object.fromEntries(admissionStages.map(stage => [stage.key, stage]))
  const stageIndex = (status: string) => Math.max(0, admissionStages.findIndex(stage => stage.key === status))
  const applicantCounts = admissionStages.reduce((acc: any, stage) => ({ ...acc, [stage.key]: intakeList.filter((x: any) => x.status === stage.key).length }), {})

  const filteredApplicants = intakeList.filter((app: any) => {
    if (intakeSection !== 'applicants') return false
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📋 Intake / Admissions</h1>
        {intakeSection === 'applicants' && !selectedIntake && (
          <button onClick={() => {
            const newApp = { id: Date.now(), name: 'New Applicant', dob: '', currentSchool: '', shul: '', heardAbout: '', fatherName: '', fatherPhone: '', motherName: '', motherMaiden: '', motherPhone: '', address: '', program: divisionView === 'yeshiva_ketana' ? 'yeshiva-ketana' : 'mesivta', status: 'applicant', tourDate: '', tourBy: '', interviewDate: '', nextStep: 'Schedule tour', diagnoses: [], issues: '', interviewNotes: '', scores: {}, placements: {}, documents: [] }
            setIntakeList((prev: any[]) => [...prev, newApp])
            setSelectedIntake(newApp)
            setIntakeTab('info')
          }} style={S.btn('primary')}>+ New Applicant</button>
        )}
        {intakeSection === 'pre' && !selectedPreIntake && (
          <button onClick={() => {
            const newLead = { id: Date.now(), name: '', phone: '', program: 'mesivta', status: 'call-back', callNotes: '', tourDate: '', tourTime: '', tourBy: 'Rabbi Baum', interviewDate: '', interviewTime: '', followUpNotes: '' }
            setPreIntakeList((prev: any[]) => [...prev, newLead])
            setSelectedPreIntake(newLead)
          }} style={S.btn('primary')}>+ New Lead</button>
        )}
      </div>

      {!selectedIntake && !selectedPreIntake && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setIntakeSection('pre')} style={{ padding: '10px 20px', borderRadius: 8, border: `2px solid ${intakeSection === 'pre' ? '#0f172a' : '#e5e7eb'}`, background: intakeSection === 'pre' ? '#0f172a' : '#fff', color: intakeSection === 'pre' ? '#fff' : '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            📞 Pre-Intake Leads
            <span style={{ marginLeft: 8, background: intakeSection === 'pre' ? 'rgba(255,255,255,0.2)' : '#f8fafc', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{preIntakeList.length}</span>
          </button>
          <button onClick={() => setIntakeSection('applicants')} style={{ padding: '10px 20px', borderRadius: 8, border: `2px solid ${intakeSection === 'applicants' ? '#0f172a' : '#e5e7eb'}`, background: intakeSection === 'applicants' ? '#0f172a' : '#fff', color: intakeSection === 'applicants' ? '#fff' : '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            📋 Applicants & Interviews
            <span style={{ marginLeft: 8, background: intakeSection === 'applicants' ? 'rgba(255,255,255,0.2)' : '#f8fafc', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{intakeList.length}</span>
          </button>
        </div>
      )}

      {intakeSection === 'pre' && !selectedPreIntake && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              ['call-back', '📞 Call Back', preIntakeList.filter((x: any) => x.status === 'call-back').length, '#9f1239'],
              ['tour-scheduled', '🏫 Tour Scheduled', preIntakeList.filter((x: any) => x.status === 'tour-scheduled').length, '#4f6687'],
              ['interview-scheduled', '📋 Interview Scheduled', preIntakeList.filter((x: any) => x.status === 'interview-scheduled').length, '#56765f'],
              ['needs-interview-time', '⏰ Needs Interview Time', preIntakeList.filter((x: any) => x.status === 'needs-interview-time').length, '#9a6a2a'],
              [null, '🏥 Mesivta / YK', `${preIntakeList.filter((x: any) => x.program === 'mesivta').length} / ${preIntakeList.filter((x: any) => x.program === 'yeshiva-ketana').length}`, '#6d28d9'],
            ].map(([status, label, val, color]: any) => {
              const isClickable = Boolean(status)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (!status) return
                    const section = document.getElementById(`pre-intake-group-${status}`)
                    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  style={{ width: '100%', background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e2e8f0', borderTop: `3px solid ${color}`, textAlign: 'center', cursor: isClickable ? 'pointer' : 'default', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(15,23,42,0.02)', transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease' }}
                  onMouseEnter={(e: any) => { if (!isClickable) return; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 7px 18px rgba(15,23,42,0.09)'; e.currentTarget.style.borderColor=color }}
                  onMouseLeave={(e: any) => { if (!isClickable) return; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 2px rgba(15,23,42,0.02)'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.borderTopColor=color }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{label}</div>
                  {isClickable && <div style={{ fontSize: 9, color, marginTop: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>View students ↓</div>}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['call-back', '📞 Calls to Return', '#9f1239'],
              ['needs-interview-time', '⏰ Needs Interview Time Set', '#9a6a2a'],
              ['tour-scheduled', '🏫 Tour Scheduled', '#4f6687'],
              ['interview-scheduled', '📋 Interview Scheduled', '#56765f'],
            ].map(([status, groupLabel, color]: any) => {
              const group = preIntakeList.filter((x: any) => x.status === status)
              if (group.length === 0) return null
              return (
                <div key={status} id={`pre-intake-group-${status}`} style={{ scrollMarginTop: 24, paddingTop: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase' }}>{groupLabel} ({group.length})</div>
                  {group.map((lead: any) => (
                    <div key={lead.id} onClick={() => setSelectedPreIntake(lead)} style={{ background: '#fff', border: `1px solid #e2e8f0`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '12px 16px', marginBottom: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'} onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.boxShadow='none'}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{lead.name || 'Unnamed Lead'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          📞 {lead.phone} · {lead.program === 'mesivta' ? '🏫 Mesivta' : '📚 Yeshiva Ketana'}
                          {lead.tourDate && ` · Tour: ${lead.tourDate} ${lead.tourTime}`}
                          {lead.interviewDate && ` · Interview: ${lead.interviewDate} ${lead.interviewTime}`}
                        </div>
                        {lead.callNotes && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>&quot;{lead.callNotes.slice(0,60)}{lead.callNotes.length > 60 ? '...' : ''}&quot;</div>}
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>View →</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {intakeSection === 'pre' && selectedPreIntake && (
        <div>
          <button onClick={() => setSelectedPreIntake(null)} style={{ ...S.btn('ghost'), marginBottom: 16 }}>← Back to leads</button>
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <div style={{ background: '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <input value={selectedPreIntake.name} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, name: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, name: e.target.value} : x)) }} placeholder="Full name..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, width: '100%', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {[['mesivta','🏫 Mesivta'],['yeshiva-ketana','📚 Yeshiva Ketana']].map(([val, label]: any) => (
                    <button key={val} onClick={() => { setSelectedPreIntake((p: any) => ({...p, program: val})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, program: val} : x)) }} style={{ padding: '2px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: selectedPreIntake.program === val ? '#fff' : 'rgba(255,255,255,0.15)', color: selectedPreIntake.program === val ? '#0f172a' : '#fff' }}>{label}</button>
                  ))}
                </div>
              </div>
              <input value={selectedPreIntake.phone} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, phone: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, phone: e.target.value} : x)) }} placeholder="Phone..." style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 14, width: 160 }} />
            </div>
            <div style={{ padding: 20, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📍 Status Pipeline</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    ['call-back', '📞 Call Back'],
                    ['tour-scheduled', '🏫 Schedule Tour'],
                    ['needs-interview-time', '⏰ Set Interview Time'],
                    ['interview-scheduled', '📋 Interview Scheduled'],
                    ['move-to-applicant', '✅ Move to Applicants'],
                  ].map(([val, label]) => (
                    <button key={val} onClick={() => {
                      if (val === 'move-to-applicant') {
                        const newApp = { id: Date.now(), name: selectedPreIntake.name, dob: '', currentSchool: '', shul: '', heardAbout: 'Pre-intake lead', fatherName: '', fatherPhone: selectedPreIntake.phone, motherName: '', motherMaiden: '', motherPhone: '', address: '', program: selectedPreIntake.program || 'mesivta', status: selectedPreIntake.status === 'tour-scheduled' ? 'tour-scheduled' : selectedPreIntake.status === 'interview-scheduled' ? 'interview-scheduled' : selectedPreIntake.status === 'needs-interview-time' ? 'tour-completed' : 'applicant', tourDate: selectedPreIntake.tourDate || '', tourBy: selectedPreIntake.tourBy || 'Rabbi Baum', interviewDate: selectedPreIntake.interviewDate || '', nextStep: selectedPreIntake.status === 'interview-scheduled' ? 'Prepare interview packet' : selectedPreIntake.status === 'needs-interview-time' ? 'Schedule interview' : selectedPreIntake.status === 'tour-scheduled' ? 'Tour scheduled' : 'Schedule tour', diagnoses: [], issues: selectedPreIntake.callNotes, interviewNotes: '', scores: {}, placements: {}, documents: [] }
                        setIntakeList((prev: any[]) => [...prev, newApp])
                        setPreIntakeList((prev: any[]) => prev.filter((x: any) => x.id !== selectedPreIntake.id))
                        setSelectedPreIntake(null)
                        setIntakeSection('applicants')
                        setSelectedIntake(newApp)
                        setIntakeTab('info')
                      } else {
                        setSelectedPreIntake((p: any) => ({...p, status: val}))
                        setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, status: val} : x))
                      }
                    }} style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${selectedPreIntake.status === val ? '#0f172a' : '#e5e7eb'}`, background: selectedPreIntake.status === val ? '#0f172a' : '#fff', color: selectedPreIntake.status === val ? '#fff' : '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🏫 Tour</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Date</div>
                      <input type="date" value={selectedPreIntake.tourDate} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, tourDate: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, tourDate: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Time</div>
                      <input type="time" value={selectedPreIntake.tourTime} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, tourTime: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, tourTime: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Tour Staff</div>
                      <select value={selectedPreIntake.tourBy || 'Rabbi Baum'} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, tourBy: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, tourBy: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}>
                        {TOUR_STAFF_OPTIONS.map((name: string) => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Interview</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Date</div>
                      <input type="date" value={selectedPreIntake.interviewDate} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, interviewDate: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, interviewDate: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Time</div>
                      <input type="time" value={selectedPreIntake.interviewTime} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, interviewTime: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, interviewTime: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📞 Call Notes</div>
                <textarea value={selectedPreIntake.callNotes} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, callNotes: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, callNotes: e.target.value} : x)) }} placeholder="Notes from the call — who called, what was discussed, any concerns..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 90, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📝 Follow-Up Notes</div>
                <textarea value={selectedPreIntake.followUpNotes} onChange={(e: any) => { setSelectedPreIntake((p: any) => ({...p, followUpNotes: e.target.value})); setPreIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedPreIntake.id ? {...x, followUpNotes: e.target.value} : x)) }} placeholder="Reminders, next steps..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 60, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {intakeSection === 'applicants' && (
        <div>
          {(() => {
            const report = getAdmissionsReport(intakeList)
            const nameLine = (arr: any[]) => arr.length ? arr.map((x: any) => x.name).join(', ') : 'None yet'
            return (
              <details style={{ ...S.card, marginBottom: 16, padding: 0, overflow: 'hidden' }}>
                <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#172033' }}>Admissions Report</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Click to open accepted counts, names, waitlist, missing documents, and follow-ups.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ padding: '8px 12px', borderRadius: 999, background: '#eef4f0', border: '1px solid #b9d7c2', fontSize: 12, fontWeight: 800, color: '#20462b' }}>Mesivta Accepted: {report.acceptedMesivta.length}</span>
                    <span style={{ padding: '8px 12px', borderRadius: 999, background: '#eef4f0', border: '1px solid #b9d7c2', fontSize: 12, fontWeight: 800, color: '#20462b' }}>YK Accepted: {report.acceptedYK.length}</span>
                    <span style={{ padding: '8px 12px', borderRadius: 999, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, fontWeight: 800, color: '#9a3412' }}>Needs Review: {report.waitlist.length + report.needsInfo.length}</span>
                  </div>
                </summary>
                <div style={{ padding: '0 22px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button onClick={() => window.print()} style={S.btn('ghost')}>Print Report</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: '#eef4f0', border: '1px solid #b9d7c2' }}><div style={{ fontSize: 11, color: '#2f5d3b', fontWeight: 800 }}>ACCEPTED MESIVTA</div><div style={{ fontSize: 28, fontWeight: 900, color: '#20462b' }}>{report.acceptedMesivta.length}</div></div>
                    <div style={{ padding: 14, borderRadius: 12, background: '#eef4f0', border: '1px solid #b9d7c2' }}><div style={{ fontSize: 11, color: '#2f5d3b', fontWeight: 800 }}>ACCEPTED YESHIVA KETANA</div><div style={{ fontSize: 28, fontWeight: 900, color: '#20462b' }}>{report.acceptedYK.length}</div></div>
                    <div style={{ padding: 14, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}><div style={{ fontSize: 11, color: '#9a3412', fontWeight: 800 }}>WAITLIST / NEEDS INFO</div><div style={{ fontSize: 28, fontWeight: 900, color: '#7c2d12' }}>{report.waitlist.length + report.needsInfo.length}</div></div>
                    <div style={{ padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 11, color: '#475569', fontWeight: 800 }}>OPEN FOLLOW-UPS</div><div style={{ fontSize: 28, fontWeight: 900, color: '#172033' }}>{report.openFollowUpsTotal}</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8 }}>Accepted Mesivta Boys</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{nameLine(report.acceptedMesivta)}</div></div>
                    <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8 }}>Accepted Yeshiva Ketana Boys</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{nameLine(report.acceptedYK)}</div></div>
                    <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8 }}>Waitlist</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{nameLine(report.waitlist)}</div></div>
                    <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8 }}>Needs Info</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{nameLine(report.needsInfo)}</div></div>
                  </div>
                </div>
              </details>
            )
          })()}

          <div style={{ ...S.card, marginBottom: 16, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#172033' }}>Applicant Pipeline</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Track each boy from initial inquiry to enrollment decision.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['all','All', intakeList.length], ...admissionStages.map((stage: any) => [stage.key, stage.label, applicantCounts[stage.key] || 0])].map(([val, label, count]: any) => (
                  <button key={val} onClick={() => setIntakeSection('applicants')} style={{ padding: '7px 10px', borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, fontWeight: 700, color: '#334155' }}>{label}: {count}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 0 }}>
              {filteredApplicants.length === 0 && <div style={{ padding: '22px', color: '#64748b', fontSize: 13 }}>No applicants yet.</div>}
              {filteredApplicants.map((app: any, i: number) => (
                <div key={app.id} onClick={() => { setSelectedIntake(app); setIntakeTab('info') }} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1.35fr) 130px minmax(220px,1.25fr) minmax(210px,1.2fr) 72px', gap: 12, alignItems: 'center', padding: '13px 16px', borderBottom: i === filteredApplicants.length - 1 ? 'none' : '1px solid #edf2f7', cursor: 'pointer', background: '#ffffff' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{app.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{app.program === 'yeshiva-ketana' ? 'Yeshiva Ketana' : 'Mesivta'} · {app.dob || 'DOB unknown'}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{app.status}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{app.nextStep || 'No next step yet'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{app.tourDate ? `Tour: ${app.tourDate}` : ''}{app.interviewDate ? `${app.tourDate ? ' · ' : ''}Interview: ${app.interviewDate}` : ''}</div>
                  <div style={{ textAlign: 'right', color: '#4f6687', fontWeight: 700, fontSize: 12 }}>Open →</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedIntake ? (
        <div>
          <button onClick={() => setSelectedIntake(null)} style={S.btn('ghost')}>← Back to list</button>
          <div style={{ marginTop: 14, background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ background: '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{initials(selectedIntake.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{selectedIntake.name}</div>
                <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>Applicant profile · {selectedIntake.program === 'yeshiva-ketana' ? 'Yeshiva Ketana' : 'Mesivta'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['info','family','assessment','checklist','followups','contact','decision','templates','documents'].map((tab: string) => {
                  const labels: any = { info: 'Overview', family: 'Family', assessment: 'Assessment', checklist: 'Checklist', followups: 'Follow-Ups', contact: 'Contact', decision: 'Decision', templates: 'Templates', documents: 'Documents' }
                  return <button key={tab} onClick={() => setIntakeTab(tab)} style={{ padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: intakeTab === tab ? 700 : 400, borderBottom: intakeTab === tab ? '2px solid #0f172a' : '2px solid transparent', color: intakeTab === tab ? '#0f172a' : '#64748b' }}>{labels[tab]}</button>
                })}
              </div>
            </div>
            <div style={{ padding: 22, background: '#f8fafc' }}>
              {intakeTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={S.card}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🧾 Core Info</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {['name','dob','currentSchool','shul','heardAbout','fatherName','fatherPhone','motherName','motherPhone','address','program'].map((key: string) => (
                        <div key={key}>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'capitalize' }}>{key}</div>
                          <input value={selectedIntake[key] || ''} onChange={(e: any) => { setSelectedIntake((prev: any) => ({ ...prev, [key]: e.target.value })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, [key]: e.target.value } : x)) }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={S.card}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🧠 Intake Notes</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      <textarea value={selectedIntake.issues || ''} onChange={(e: any) => { setSelectedIntake((prev: any) => ({ ...prev, issues: e.target.value })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, issues: e.target.value } : x)) }} placeholder="Known issues, background..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 80, boxSizing: 'border-box', resize: 'vertical' }} />
                      <textarea value={selectedIntake.interviewNotes || ''} onChange={(e: any) => { setSelectedIntake((prev: any) => ({ ...prev, interviewNotes: e.target.value })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, interviewNotes: e.target.value } : x)) }} placeholder="Notes from intake interview..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 80, boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>
                  </div>
                </div>
              )}
              {intakeTab === 'family' && (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>👨‍👩‍👧‍👦 Family Info</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {['fatherName','fatherPhone','fatherEmail','motherName','motherPhone','motherEmail'].map((key: string) => (
                      <input key={key} value={selectedIntake[key] || ''} onChange={(e: any) => { setSelectedIntake((prev: any) => ({ ...prev, [key]: e.target.value })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, [key]: e.target.value } : x)) }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    ))}
                    <input value={selectedIntake.address || ''} onChange={(e: any) => { setSelectedIntake((prev: any) => ({ ...prev, address: e.target.value })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, address: e.target.value } : x)) }} placeholder="Full address..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}
              {intakeTab === 'assessment' && (
                <div style={{ display: 'grid', gap: 14 }}>
                  {INTAKE_ASSESSMENT_AREAS.map((section: any) => (
                    <div key={section.section} style={S.card}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{section.section}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>{section.helper}</div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {section.items.map((item: any) => {
                          const val = selectedIntake.scores?.[item.key] || 0
                          const placement = INTAKE_PLACEMENT_LEVELS.find((level: any) => level.key === selectedIntake.placements?.[item.key])?.label
                          return (
                            <div key={item.key} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</div>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{item.detail}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <select value={val} onChange={(e: any) => { const n = Number(e.target.value); const updatedScores = { ...(selectedIntake.scores || {}), [item.key]: n }; setSelectedIntake((prev: any) => ({ ...prev, scores: updatedScores })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, scores: updatedScores } : x)) }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}>
                                    {[0,1,2,3,4,5].map((n: number) => <option key={n} value={n}>{intakeScoreLabel(n)}</option>)}
                                  </select>
                                  <div style={{ fontSize: 11, color: intakeScoreColor(val), marginTop: 4 }}>{placement || 'No placement'}</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {intakeTab === 'checklist' && (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📋 Required Documents</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {['applicationForm','birthCertificate','immunization','iepEvaluation','reportCard','schoolRecords','parentQuestionnaire','tuitionPaperwork','emergencyContacts','medicalAllergies'].map((key: string) => {
                      const checked = !!selectedIntake.requiredDocsComplete?.[key]
                      return (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: checked ? '#f0fdf4' : '#fff', border: `1px solid ${checked ? '#bbf7d0' : '#e2e8f0'}` }}>
                          <input type="checkbox" checked={checked} onChange={() => { const updatedDocs = { ...(selectedIntake.requiredDocsComplete || {}), [key]: !checked }; setSelectedIntake((prev: any) => ({ ...prev, requiredDocsComplete: updatedDocs })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, requiredDocsComplete: updatedDocs } : x)) }} />
                          <span style={{ fontSize: 13 }}>{key}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              {intakeTab === 'followups' && (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🔔 Follow-Ups</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {((selectedIntake.followUps || []).length === 0) && <div style={{ color: '#64748b', fontSize: 13 }}>No follow-ups yet.</div>}
                    {(selectedIntake.followUps || []).map((task: any) => (
                      <div key={task.id} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{task.text}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{task.due || 'No date'} · {task.assigned || 'Office'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {intakeTab === 'contact' && (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📞 Contact Log</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {(selectedIntake.contactLogs || []).map((log: any) => (
                      <div key={log.id} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{log.summary}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{log.date} · {log.method} · {log.staff}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {intakeTab === 'decision' && (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>✅ Decision</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <input value={selectedIntake.decision || ''} onChange={(e: any) => { setSelectedIntake((prev: any) => ({ ...prev, decision: e.target.value })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, decision: e.target.value } : x)) }} placeholder="Decision" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                    <input value={selectedIntake.decisionDate || ''} onChange={(e: any) => { setSelectedIntake((prev: any) => ({ ...prev, decisionDate: e.target.value })); setIntakeList((prev: any[]) => prev.map((x: any) => x.id === selectedIntake.id ? { ...x, decisionDate: e.target.value } : x)) }} type="date" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}
              {intakeTab === 'templates' && (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📝 Message Templates</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {['Tour Confirmation','Missing Documents Request','Interview Confirmation','Acceptance / Next Step','Follow-Up After No Response','Enrollment Packet'].map((template: string) => (
                      <div key={template} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>{template}</div>
                    ))}
                  </div>
                </div>
              )}
              {intakeTab === 'documents' && (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📎 Documents</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {(selectedIntake.documents || []).map((doc: any, i: number) => <div key={i} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>{doc.name}</div>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
