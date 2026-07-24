import { useState } from 'react'

export function StudentScoresTab({
  student,
  students,
  setStudents,
  role,
  userName,
  S,
  DEFAULT_ACADEMIC_TEACHER,
  ACADEMIC_AREAS,
  SKILL_RATINGS,
  RATING_SCORE,
  academicPct,
  academicDisplay,
  academicStatus,
  academicStatusColor,
  persistStudentFields,
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ teacher: userName?.startsWith('Rabbi') ? userName : DEFAULT_ACADEMIC_TEACHER, subject: 'Math', skill: '2-digit', assessmentName: '', date: new Date().toISOString().slice(0,10), scoreType: 'points', score: '', maxScore: '100', rating: 'Good', notes: '' })
  const s = students.find(x => x.id === student.id) || student
  const scores = s.testScores || []
  const numeric = scores.filter(x => x.scoreType !== 'rating' && x.maxScore)
  const avg = numeric.length ? Math.round(numeric.reduce((acc, x) => acc + academicPct(x), 0) / numeric.length) : null
  const subjectOptions = Object.keys(ACADEMIC_AREAS[form.teacher] || ACADEMIC_AREAS[DEFAULT_ACADEMIC_TEACHER])
  const skillOptions = (ACADEMIC_AREAS[form.teacher]?.[form.subject] || ACADEMIC_AREAS[DEFAULT_ACADEMIC_TEACHER]?.[form.subject] || [])

  function updateForm(key, val) {
    setForm(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'teacher') {
        const firstSubject = Object.keys(ACADEMIC_AREAS[val] || ACADEMIC_AREAS[DEFAULT_ACADEMIC_TEACHER])[0]
        next.subject = firstSubject
        next.skill = (ACADEMIC_AREAS[val] || ACADEMIC_AREAS[DEFAULT_ACADEMIC_TEACHER])[firstSubject][0]
      }
      if (key === 'subject') next.skill = (ACADEMIC_AREAS[next.teacher]?.[val] || ACADEMIC_AREAS[DEFAULT_ACADEMIC_TEACHER]?.[val] || ['General'])[0]
      return next
    })
  }

  function addScore() {
    if (!form.assessmentName.trim()) return alert('Add an assessment name')
    if (form.scoreType === 'points' && (!form.score || !form.maxScore)) return alert('Add score and max score')
    const entry = {
      id: `ts${Date.now()}`,
      teacher: form.teacher,
      subject: form.subject,
      skill: form.skill,
      assessmentName: form.assessmentName,
      date: form.date,
      scoreType: form.scoreType,
      score: form.scoreType === 'points' ? Number(form.score) : null,
      maxScore: form.scoreType === 'points' ? Number(form.maxScore) : null,
      rating: form.scoreType === 'rating' ? form.rating : null,
      notes: form.notes,
    }
    const updatedScores = [entry, ...(s.testScores || [])]
    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, testScores: updatedScores } : x))
    
    // Persist to database
    if (persistStudentFields) {
      persistStudentFields(s.id, { testScores: updatedScores })
    }
    
    setShowAdd(false)
    setForm(prev => ({ ...prev, assessmentName: '', score: '', notes: '' }))
  }

  const bySubject = ['Math','Reading','Writing'].map(subject => {
    const items = scores.filter(x => x.subject === subject)
    const nums = items.filter(x => x.scoreType !== 'rating' && x.maxScore)
    const ratings = items.filter(x => x.scoreType === 'rating')
    const subjAvg = nums.length ? Math.round(nums.reduce((acc,x)=>acc+academicPct(x),0)/nums.length) : null
    const ratingAvg = ratings.length ? Math.round(ratings.reduce((acc,x)=>acc+(RATING_SCORE[x.rating]||0),0)/ratings.length*10)/10 : null
    return { subject, count: items.length, subjAvg, ratingAvg }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div style={S.card}><div style={{ fontSize: 11, color: '#64748b' }}>Numeric Avg</div><div style={{ fontSize: 24, fontWeight: 700, color: '#263241' }}>{avg !== null ? `${avg}%` : '—'}</div></div>
        <div style={S.card}><div style={{ fontSize: 11, color: '#64748b' }}>Scores</div><div style={{ fontSize: 24, fontWeight: 700, color: '#263241' }}>{scores.length}</div></div>
        <div style={S.card}><div style={{ fontSize: 11, color: '#64748b' }}>Ratings</div><div style={{ fontSize: 24, fontWeight: 700, color: '#263241' }}>{scores.filter(x=>x.scoreType==='rating').length}</div></div>
        <button onClick={() => setShowAdd(true)} style={{ ...S.btn('primary'), borderRadius: 10 }}>+ Add Score</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {bySubject.map(x => <div key={x.subject} style={S.card}><div style={{ fontWeight: 700, fontSize: 13 }}>{x.subject}</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{x.count} entries</div><div style={{ fontSize: 18, fontWeight: 700, color: '#263241', marginTop: 6 }}>{x.subjAvg !== null ? `${x.subjAvg}%` : x.ratingAvg ? `${x.ratingAvg}/4 rating` : '—'}</div></div>)}
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Test Scores & Skill Ratings</div>
        {scores.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No academic scores yet.</div>}
        {scores.map(score => {
          const status = academicStatus(score)
          return <div key={score.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.8fr 0.7fr', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f0f1f6' }}>
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>{score.assessmentName}</div><div style={{ fontSize: 11, color: '#64748b' }}>{score.date} · {score.teacher}</div></div>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>{score.subject}</div><div style={{ fontSize: 11, color: '#64748b' }}>{score.skill}</div></div>
            <div style={{ fontWeight: 700, color: '#263241' }}>{academicDisplay(score)}</div>
            <div><span style={S.badge(academicStatusColor(status), academicStatusColor(status)+'15')}>{status}</span></div>
            {score.notes && <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#64748b', background: '#ffffff', borderRadius: 8, padding: '8px 10px' }}>{score.notes}</div>}
          </div>
        })}
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 24px 80px rgba(15,23,42,0.28)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0f7', display: 'flex', justifyContent: 'space-between' }}><div style={{ fontWeight: 700, color: '#263241' }}>Add Score — {s.name}</div><button onClick={() => setShowAdd(false)} style={{ border:'none', background:'#f4f5f8', borderRadius:'50%', width:30, height:30, cursor:'pointer' }}>×</button></div>
            <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select value={form.teacher} onChange={e=>updateForm('teacher', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}><option>Rabbi Abowitz</option><option>Rabbi Abramowitz</option></select>
              <input type="date" value={form.date} onChange={e=>updateForm('date', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <select value={form.subject} onChange={e=>updateForm('subject', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>{subjectOptions.map(x=><option key={x}>{x}</option>)}</select>
              <select value={form.skill} onChange={e=>updateForm('skill', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>{skillOptions.map(x=><option key={x}>{x}</option>)}</select>
              <input placeholder="Assessment name" value={form.assessmentName} onChange={e=>updateForm('assessmentName', e.target.value)} style={{ gridColumn:'1 / -1', padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <select value={form.scoreType} onChange={e=>updateForm('scoreType', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}><option value="points">Number score</option><option value="rating">Skill rating</option></select>
              {form.scoreType === 'rating' ? <select value={form.rating} onChange={e=>updateForm('rating', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>{SKILL_RATINGS.map(x=><option key={x}>{x}</option>)}</select> : <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}><input placeholder="Score" value={form.score} onChange={e=>updateForm('score', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} /><input placeholder="Max" value={form.maxScore} onChange={e=>updateForm('maxScore', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} /></div>}
              <textarea placeholder="Notes" value={form.notes} onChange={e=>updateForm('notes', e.target.value)} style={{ gridColumn:'1 / -1', padding: 10, border:'1px solid #e5e7eb', borderRadius:8, minHeight:70 }} />
              <button onClick={addScore} style={{ ...S.btn('primary'), gridColumn:'1 / -1', padding: 12 }}>Save Score</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AcademicsPage({
  students,
  setStudents,
  role,
  userName,
  teacherClass,
  openStudent,
  S,
  CLASSES,
  STUDENT_CLASSES,
  ACADEMIC_AREAS,
  SKILL_RATINGS,
  academicPct,
  academicDisplay,
  academicStatus,
  academicStatusColor,
}) {
  const [classFilter, setClassFilter] = useState(role === 'teacher' && teacherClass ? teacherClass : 'all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState(role === 'teacher' ? userName : 'all')
  const [addStudentId, setAddStudentId] = useState(null)
  const visibleStudents = students.filter(s => classFilter === 'all' || STUDENT_CLASSES[s.id] === classFilter)
  const allScores = visibleStudents.flatMap(s => (s.testScores || []).map(score => ({ ...score, studentId: s.id, studentName: s.name }))).filter(score => (teacherFilter === 'all' || score.teacher === teacherFilter) && (subjectFilter === 'all' || score.subject === subjectFilter) && (skillFilter === 'all' || score.skill === skillFilter))
  const numericScores = allScores.filter(x => x.scoreType !== 'rating' && x.maxScore)
  const classAvg = numericScores.length ? Math.round(numericScores.reduce((acc, x) => acc + academicPct(x), 0) / numericScores.length) : null
  const latestByStudent = visibleStudents.map(st => {
    const scores = (st.testScores || []).filter(score => (teacherFilter === 'all' || score.teacher === teacherFilter) && (subjectFilter === 'all' || score.subject === subjectFilter) && (skillFilter === 'all' || score.skill === skillFilter)).sort((a,b)=>b.date.localeCompare(a.date))
    const nums = scores.filter(x=>x.scoreType !== 'rating' && x.maxScore)
    const avg = nums.length ? Math.round(nums.reduce((acc,x)=>acc+academicPct(x),0)/nums.length) : null
    const latest = scores[0]
    return { student: st, scores, latest, avg, status: latest ? academicStatus(latest) : 'Missing' }
  })
  const statusCounts = { Excellent: 0, 'Doing Well': 0, Watch: 0, 'Needs Support': 0, Missing: 0 }
  latestByStudent.forEach(row => { statusCounts[row.status] = (statusCounts[row.status] || 0) + 1 })
  const ratingCounts = { Weak: 0, Developing: 0, Good: 0, Great: 0 }
  allScores.filter(x=>x.scoreType==='rating').forEach(x => { ratingCounts[x.rating] = (ratingCounts[x.rating] || 0) + 1 })
  const subjects = ['all','Math','Reading','Writing']
  const skills = ['all', ...new Set(Object.values(ACADEMIC_AREAS).flatMap(area => Object.values(area).flat()))]

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
        <div><h1 style={{ fontSize:22, fontWeight:900, color:'#1e293b', margin:'0 0 6px' }}>Academics</h1><div style={{ fontSize:13, color:'#64748b' }}>Class view for test scores and skill ratings</div></div>
      </div>

      <div style={{ ...S.card, marginBottom:16, display:'grid', gridTemplateColumns: role === 'admin' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap:10 }}>
        {role === 'admin' && <select value={teacherFilter} onChange={e=>setTeacherFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}><option value="all">All teachers</option><option>Rabbi Abowitz</option><option>Rabbi Abramowitz</option></select>}
        <select value={classFilter} onChange={e=>setClassFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}><option value="all">All classes</option>{CLASSES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={subjectFilter} onChange={e=>{setSubjectFilter(e.target.value); setSkillFilter('all')}} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>{subjects.map(x=><option key={x} value={x}>{x === 'all' ? 'All subjects' : x}</option>)}</select>
        <select value={skillFilter} onChange={e=>setSkillFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>{skills.filter(x=> subjectFilter==='all' || x==='all' || Object.values(ACADEMIC_AREAS).some(area => (area[subjectFilter] || []).includes(x))).map(x=><option key={x} value={x}>{x === 'all' ? 'All skills' : x}</option>)}</select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, marginBottom:16 }}>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Class Avg</div><div style={{ fontSize:26, fontWeight:900, color:'#1e293b' }}>{classAvg !== null ? `${classAvg}%` : '—'}</div></div>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Doing Well+</div><div style={{ fontSize:26, fontWeight:900, color:'#4b6854' }}>{statusCounts.Excellent + statusCounts['Doing Well']}</div></div>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Needs Support</div><div style={{ fontSize:26, fontWeight:900, color:'#9f1239' }}>{statusCounts['Needs Support']}</div></div>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Watch</div><div style={{ fontSize:26, fontWeight:900, color:'#9a6a2a' }}>{statusCounts.Watch}</div></div>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Missing</div><div style={{ fontSize:26, fontWeight:900, color:'#64748b' }}>{statusCounts.Missing}</div></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 0.7fr', gap:16 }}>
        <div style={S.card}>
          <div style={{ fontWeight:900, fontSize:15, marginBottom:12 }}>Class Student View</div>
          {latestByStudent.map(row => <div key={row.student.id} style={{ display:'grid', gridTemplateColumns:'1.2fr 0.6fr 1.2fr 0.8fr 0.7fr', gap:12, alignItems:'center', padding:'11px 0', borderTop:'1px solid #f0f1f6' }}>
            <div onClick={()=>openStudent(row.student, 'testScores')} style={{ cursor:'pointer' }}><div style={{ fontWeight:850, fontSize:13 }}>{row.student.name}</div><div style={{ fontSize:11, color:'#64748b' }}>{CLASSES.find(c=>c.id===STUDENT_CLASSES[row.student.id])?.name}</div></div>
            <div style={{ fontWeight:900, color:'#1e293b' }}>{row.avg !== null ? `${row.avg}%` : '—'}</div>
            <div>{row.latest ? <><div style={{ fontWeight:750, fontSize:12 }}>{row.latest.assessmentName}</div><div style={{ fontSize:11, color:'#64748b' }}>{row.latest.subject} · {row.latest.skill}</div></> : <span style={{ color:'#94a3b8', fontSize:12 }}>No scores</span>}</div>
            <div>{row.latest ? academicDisplay(row.latest) : '—'}</div>
            <div><span style={S.badge(academicStatusColor(row.status), academicStatusColor(row.status)+'15')}>{row.status}</span></div>
          </div>)}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={S.card}>
            <div style={{ fontWeight:900, fontSize:15, marginBottom:12 }}>Rating Breakdown</div>
            {SKILL_RATINGS.map(r => <div key={r} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid #f0f1f6' }}><span style={{ fontSize:13 }}>{r}</span><strong>{ratingCounts[r]}</strong></div>)}
          </div>

          <div style={S.card}>
            <div style={{ fontWeight:900, fontSize:15, marginBottom:12 }}>Add Score</div>
            <select value={addStudentId || ''} onChange={e=>setAddStudentId(Number(e.target.value))} style={{ width:'100%', padding:10, border:'1px solid #e5e7eb', borderRadius:8, marginBottom:10 }}><option value="">Choose student</option>{visibleStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <button disabled={!addStudentId} onClick={()=>{ const st = students.find(s=>s.id===addStudentId); if (st) openStudent(st, 'testScores') }} style={{ ...S.btn(addStudentId ? 'primary' : 'ghost'), width:'100%' }}>Open Student Scores</button>
            <div style={{ fontSize:11, color:'#64748b', marginTop:10 }}>Scores are added inside the student profile so each boy keeps a full academic history.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
