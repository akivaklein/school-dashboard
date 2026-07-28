import { useEffect, useMemo, useState } from 'react'

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
  academicTeacherOptions = [],
  academicPct,
  academicDisplay,
  academicStatus,
  academicStatusColor,
  persistStudentFields,
}) {
  const teacherOptions = Array.from(new Set([...(academicTeacherOptions || []), ...Object.keys(ACADEMIC_AREAS || {})].filter(Boolean)))
  const initialTeacher = userName && teacherOptions.includes(userName) ? userName : teacherOptions[0] || DEFAULT_ACADEMIC_TEACHER
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ teacher: initialTeacher, subject: 'Math', skill: '2-digit', assessmentName: '', date: new Date().toISOString().slice(0,10), scoreType: 'points', score: '', maxScore: '100', rating: 'Good', notes: '' })
  const s = students.find(x => x.id === student.id) || student
  const scores = s.testScores || []
  const numeric = scores.filter(x => x.scoreType !== 'rating' && x.maxScore)
  const avg = numeric.length ? Math.round(numeric.reduce((acc, x) => acc + academicPct(x), 0) / numeric.length) : null
  const subjectOptions = Object.keys(ACADEMIC_AREAS[form.teacher] || ACADEMIC_AREAS[DEFAULT_ACADEMIC_TEACHER])
  const skillOptions = (ACADEMIC_AREAS[form.teacher]?.[form.subject] || ACADEMIC_AREAS[DEFAULT_ACADEMIC_TEACHER]?.[form.subject] || [])

  function scoreDisplayValue(score) {
    if (score.attemptStatus === 'absent') return 'Absent'
    if (score.attemptStatus === 'missed') return 'Missed'
    return academicDisplay(score)
  }

  function scoreStatusValue(score) {
    if (score.attemptStatus === 'absent' || score.attemptStatus === 'missed') {
      return 'Missing'
    }
    return academicStatus(score)
  }

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
          const status = scoreStatusValue(score)
          return <div key={score.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.8fr 0.7fr', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f0f1f6' }}>
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>{score.assessmentName}</div><div style={{ fontSize: 11, color: '#64748b' }}>{score.date} · {score.teacher}</div></div>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>{score.subject}</div><div style={{ fontSize: 11, color: '#64748b' }}>{score.skill}</div></div>
            <div style={{ fontWeight: 700, color: '#263241' }}>{scoreDisplayValue(score)}</div>
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
              <select value={form.teacher} onChange={e=>updateForm('teacher', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>{teacherOptions.map(option => <option key={option} value={option}>{option}</option>)}</select>
              <input type="date" value={form.date} onChange={e=>updateForm('date', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <select value={form.subject} onChange={e=>updateForm('subject', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>{subjectOptions.map(x=><option key={x}>{x}</option>)}</select>
              <select value={form.skill} onChange={e=>updateForm('skill', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>{skillOptions.map(x=><option key={x}>{x}</option>)}</select>
              <input placeholder="Assessment name" value={form.assessmentName} onChange={e=>updateForm('assessmentName', e.target.value)} style={{ gridColumn:'1 / -1', padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <select value={form.scoreType} onChange={e=>updateForm('scoreType', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}><option value="points">Number score</option><option value="rating">Skill rating</option></select>
              {form.scoreType === 'rating' ? <select value={form.rating} onChange={e=>updateForm('rating', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>{SKILL_RATINGS.map(x=><option key={x}>{x}</option>)}</select> : <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}><input placeholder="Score" value={form.score} onChange={e=>updateForm('score', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} /><input placeholder="Max" value={form.maxScore} onChange={e=>updateForm('maxScore', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} /></div>}
              <textarea placeholder="Notes" value={form.notes} onChange={e=>updateForm('notes', e.target.value)} spellCheck lang="en" style={{ gridColumn:'1 / -1', padding: 10, border:'1px solid #e5e7eb', borderRadius:8, minHeight:70 }} />
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
  teacherAssignedStudentIds = [],
  teacherAssignedClassIds = [],
  academicTeacherOptions = [],
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
  persistStudentFields,
  setupAssignments = {},
}) {
  const teacherOptions = Array.from(new Set([...(academicTeacherOptions || []), ...Object.keys(ACADEMIC_AREAS)]))
  const initialTeacher = role === 'teacher' && userName && teacherOptions.includes(userName)
    ? userName
    : teacherOptions[0] || (academicTeacherOptions?.[0] || 'Rabbi Abowitz')
  const [classFilter, setClassFilter] = useState(role === 'teacher' && teacherClass ? teacherClass : 'all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState(role === 'teacher' ? userName : 'all')
  const [gradeSearch, setGradeSearch] = useState('')
  const [addStudentId, setAddStudentId] = useState(null)
  const [showBulkEntry, setShowBulkEntry] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkStudentStates, setBulkStudentStates] = useState({})
  const [bulkForm, setBulkForm] = useState({
    teacher: initialTeacher,
    subject: 'Math',
    skill: '2-digit',
    assessmentName: '',
    date: new Date().toISOString().slice(0, 10),
    scoreType: 'points',
    maxScore: '100',
    rating: 'Good',
    notes: '',
    fillAllScore: '',
  })
  const scopedStudents = (role === 'teacher' || role === 'rebbe')
    ? (
        teacherAssignedStudentIds?.length
          ? students.filter(s => teacherAssignedStudentIds.includes(Number(s.id)))
          : []
      )
    : students
  const visibleStudents = scopedStudents.filter(s => classFilter === 'all' || STUDENT_CLASSES[s.id] === classFilter)

  const bulkVisibleStudents = useMemo(() => {
    if (role === 'teacher' || role === 'rebbe') {
      return visibleStudents
    }

    const assignment = setupAssignments?.[bulkForm.teacher]
    const assignedIds = new Set()

    if (assignment?.periods) {
      ;[1, 2, 3].forEach(period => {
        ;(assignment.periods?.[period] || []).forEach(studentId => {
          const normalized = Number(studentId)
          if (!Number.isNaN(normalized)) assignedIds.add(normalized)
        })
      })
    }

    ;(assignment?.caseload || []).forEach(studentId => {
      const normalized = Number(studentId)
      if (!Number.isNaN(normalized)) assignedIds.add(normalized)
    })

    if (assignedIds.size === 0) {
      return visibleStudents
    }

    return scopedStudents.filter(student => {
      const id = Number(student.id)
      if (!assignedIds.has(id)) return false
      if (classFilter !== 'all' && STUDENT_CLASSES[student.id] !== classFilter) {
        return false
      }
      return true
    })
  }, [
    role,
    visibleStudents,
    scopedStudents,
    setupAssignments,
    bulkForm.teacher,
    classFilter,
    STUDENT_CLASSES,
  ])

  useEffect(() => {
    if (!showBulkEntry) return

    setBulkStudentStates(prev => {
      const next = {}
      bulkVisibleStudents.forEach(student => {
        next[student.id] = prev[student.id] || { mode: 'score', score: '' }
      })
      return next
    })
  }, [showBulkEntry, bulkVisibleStudents])

  function getTeacherAcademicAreaMap(teacherName) {
    return ACADEMIC_AREAS[teacherName] || ACADEMIC_AREAS[teacherOptions[0]] || ACADEMIC_AREAS[academicTeacherOptions?.[0]] || ACADEMIC_AREAS['Rabbi Abowitz'] || {}
  }

  const bulkSubjectOptions = Object.keys(getTeacherAcademicAreaMap(bulkForm.teacher))
  const bulkSkillOptions = (getTeacherAcademicAreaMap(bulkForm.teacher)[bulkForm.subject] || ['General'])

  function scoreStatusValue(score) {
    if (score.attemptStatus === 'absent' || score.attemptStatus === 'missed') {
      return 'Missing'
    }
    return academicStatus(score)
  }

  function scoreDisplayValue(score) {
    if (score.attemptStatus === 'absent') return 'Absent'
    if (score.attemptStatus === 'missed') return 'Missed'
    return academicDisplay(score)
  }

  function updateBulkForm(key, value) {
    setBulkForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'teacher') {
        const teacherAreas = getTeacherAcademicAreaMap(value)
        const firstSubject = Object.keys(teacherAreas)[0]
        next.subject = firstSubject
        next.skill = (teacherAreas[firstSubject] || ['General'])[0]
      }
      if (key === 'subject') {
        next.skill = (getTeacherAcademicAreaMap(next.teacher)[value] || ['General'])[0]
      }
      return next
    })
  }

  function openBulkEntry() {
    if (bulkVisibleStudents.length === 0) {
      alert('No students are currently assigned to you for bulk grading.')
      return
    }
    const initialStates = {}
    bulkVisibleStudents.forEach(student => {
      initialStates[student.id] = { mode: 'score', score: '' }
    })
    setBulkStudentStates(initialStates)
    setShowBulkEntry(true)
  }

  function setStudentBulkMode(studentId, mode) {
    setBulkStudentStates(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { score: '' }),
        mode,
      },
    }))
  }

  function setStudentBulkScore(studentId, score) {
    setBulkStudentStates(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { mode: 'score' }),
        score,
      },
    }))
  }

  function fillAllScores() {
    const fillValue = bulkForm.fillAllScore
    setBulkStudentStates(prev => {
      const next = { ...prev }
      bulkVisibleStudents.forEach(student => {
        next[student.id] = {
          ...(next[student.id] || { mode: 'score' }),
          mode: 'score',
          score: fillValue,
        }
      })
      return next
    })
  }

  async function saveBulkScores() {
    if (!bulkForm.assessmentName.trim()) {
      alert('Add an assessment name before saving bulk scores.')
      return
    }

    if (bulkForm.scoreType === 'points' && !bulkForm.maxScore) {
      alert('Enter max score for numeric bulk grading.')
      return
    }

    const payload = []

    for (const student of bulkVisibleStudents) {
      const state = bulkStudentStates[student.id] || { mode: 'score', score: '' }

      if (state.mode === 'score') {
        if (bulkForm.scoreType === 'points' && (state.score === '' || state.score === null || state.score === undefined)) {
          continue
        }
      }

      const attemptStatus = state.mode === 'absent' ? 'absent' : state.mode === 'missed' ? 'missed' : 'scored'
      const statusNote = attemptStatus === 'absent' ? '[Absent on assessment date]' : attemptStatus === 'missed' ? '[Missed assessment]' : ''
      const mergedNotes = [statusNote, bulkForm.notes].filter(Boolean).join(' ')

      const entry = {
        id: `ts${Date.now()}-${student.id}`,
        teacher: bulkForm.teacher,
        subject: bulkForm.subject,
        skill: bulkForm.skill,
        assessmentName: bulkForm.assessmentName,
        date: bulkForm.date,
        scoreType: attemptStatus === 'scored' ? bulkForm.scoreType : 'status',
        score: attemptStatus === 'scored' && bulkForm.scoreType === 'points' ? Number(state.score) : null,
        maxScore: attemptStatus === 'scored' && bulkForm.scoreType === 'points' ? Number(bulkForm.maxScore) : null,
        rating: attemptStatus === 'scored' && bulkForm.scoreType === 'rating' ? bulkForm.rating : null,
        notes: mergedNotes,
        attemptStatus,
      }

      payload.push({
        studentId: student.id,
        nextScores: [entry, ...(student.testScores || [])],
      })
    }

    if (payload.length === 0) {
      alert('No student rows have data to save yet.')
      return
    }

    const previousById = {}
    payload.forEach(item => {
      const current = students.find(student => student.id === item.studentId)
      previousById[item.studentId] = current?.testScores || []
    })

    setBulkSaving(true)

    setStudents(prev => prev.map(student => {
      const update = payload.find(item => item.studentId === student.id)
      return update ? { ...student, testScores: update.nextScores } : student
    }))

    if (persistStudentFields) {
      const saveResults = await Promise.all(
        payload.map(item =>
          persistStudentFields(item.studentId, { testScores: item.nextScores })
        )
      )

      if (!saveResults.every(Boolean)) {
        setStudents(prev => prev.map(student => {
          if (!Object.prototype.hasOwnProperty.call(previousById, student.id)) {
            return student
          }
          return { ...student, testScores: previousById[student.id] }
        }))
        setBulkSaving(false)
        alert('Some bulk scores could not be saved to Supabase.')
        return
      }
    }

    setBulkSaving(false)
    setShowBulkEntry(false)
    setBulkForm(prev => ({ ...prev, assessmentName: '', notes: '', fillAllScore: '' }))
  }

  const allScores = visibleStudents
    .flatMap(s => (s.testScores || []).map(score => ({ ...score, studentId: s.id, studentName: s.name })))
    .filter(score => (teacherFilter === 'all' || score.teacher === teacherFilter) && (subjectFilter === 'all' || score.subject === subjectFilter) && (skillFilter === 'all' || score.skill === skillFilter))
    .filter(score => {
      const q = gradeSearch.trim().toLowerCase()
      if (!q) return true
      return `${score.studentName} ${score.teacher} ${score.subject} ${score.skill} ${score.assessmentName || ''} ${score.notes || ''}`
        .toLowerCase()
        .includes(q)
    })
  const numericScores = allScores.filter(x => x.scoreType !== 'rating' && x.maxScore && x.attemptStatus !== 'absent' && x.attemptStatus !== 'missed')
  const classAvg = numericScores.length ? Math.round(numericScores.reduce((acc, x) => acc + academicPct(x), 0) / numericScores.length) : null
  const latestByStudent = visibleStudents.map(st => {
    const scores = (st.testScores || []).filter(score => (teacherFilter === 'all' || score.teacher === teacherFilter) && (subjectFilter === 'all' || score.subject === subjectFilter) && (skillFilter === 'all' || score.skill === skillFilter)).sort((a,b)=>b.date.localeCompare(a.date))
    const nums = scores.filter(x=>x.scoreType !== 'rating' && x.maxScore && x.attemptStatus !== 'absent' && x.attemptStatus !== 'missed')
    const avg = nums.length ? Math.round(nums.reduce((acc,x)=>acc+academicPct(x),0)/nums.length) : null
    const latest = scores[0]
    return { student: st, scores, latest, avg, status: latest ? scoreStatusValue(latest) : 'Missing' }
  })
  const statusCounts = { Excellent: 0, 'Doing Well': 0, Watch: 0, 'Needs Support': 0, Missing: 0 }
  latestByStudent.forEach(row => { statusCounts[row.status] = (statusCounts[row.status] || 0) + 1 })
  const ratingCounts = { Weak: 0, Developing: 0, Good: 0, Great: 0 }
  allScores.filter(x=>x.scoreType==='rating').forEach(x => { ratingCounts[x.rating] = (ratingCounts[x.rating] || 0) + 1 })
  const subjects = ['all','Math','Reading','Writing']
  const skills = ['all', ...new Set(Object.values(ACADEMIC_AREAS).flatMap(area => Object.values(area).flat()))]
  const teacherFilterOptions = role === 'admin' ? ['all', ...teacherOptions] : []

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 12, marginBottom:18, flexWrap: 'wrap' }}>
        <div><h1 style={{ fontSize:24, fontWeight:800, color:'#16243a', margin:'0 0 6px' }}>Academics and Grades</h1><div style={{ fontSize:13, color:'#64748b' }}>Class view for test scores and skill ratings</div></div>
        <button onClick={openBulkEntry} disabled={bulkVisibleStudents.length === 0} style={{ ...S.btn(bulkVisibleStudents.length ? 'primary' : 'ghost'), whiteSpace: 'nowrap' }}>Bulk Grade Entry</button>
      </div>

      <div style={{ ...S.card, marginBottom:16, display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
        {role === 'admin' && <select value={teacherFilter} onChange={e=>setTeacherFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>{teacherFilterOptions.map(option => <option key={option} value={option}>{option === 'all' ? 'All teachers' : option}</option>)}</select>}
        <select value={classFilter} onChange={e=>setClassFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}><option value="all">All classes</option>{CLASSES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={subjectFilter} onChange={e=>{setSubjectFilter(e.target.value); setSkillFilter('all')}} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>{subjects.map(x=><option key={x} value={x}>{x === 'all' ? 'All subjects' : x}</option>)}</select>
        <select value={skillFilter} onChange={e=>setSkillFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>{skills.filter(x=> subjectFilter==='all' || x==='all' || Object.values(ACADEMIC_AREAS).some(area => (area[subjectFilter] || []).includes(x))).map(x=><option key={x} value={x}>{x === 'all' ? 'All skills' : x}</option>)}</select>
      </div>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>Filterable Grades View</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {allScores.length} matching entries · Teacher: {teacherFilter === 'all' ? 'All' : teacherFilter} · Subject: {subjectFilter === 'all' ? 'All' : subjectFilter}
            </div>
          </div>
          <input
            value={gradeSearch}
            onChange={e => setGradeSearch(e.target.value)}
            placeholder="Search student, assessment, teacher, notes..."
            spellCheck
            lang="en"
            style={{ width: 340, maxWidth: '100%', padding: 9, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }}
          />
        </div>

        <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: 9 }}>Student</th>
                <th style={{ padding: 9 }}>Teacher</th>
                <th style={{ padding: 9 }}>Subject</th>
                <th style={{ padding: 9 }}>Skill</th>
                <th style={{ padding: 9 }}>Assessment</th>
                <th style={{ padding: 9 }}>Result</th>
                <th style={{ padding: 9 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {allScores.slice().sort((a, b) => b.date.localeCompare(a.date)).map(score => (
                <tr key={`${score.id}-${score.studentId}`} style={{ borderTop: '1px solid #eef2f7' }}>
                  <td style={{ padding: 9, fontWeight: 700 }}>{score.studentName}</td>
                  <td style={{ padding: 9 }}>{score.teacher}</td>
                  <td style={{ padding: 9 }}>{score.subject}</td>
                  <td style={{ padding: 9 }}>{score.skill}</td>
                  <td style={{ padding: 9 }}>{score.assessmentName || '—'}</td>
                  <td style={{ padding: 9, fontWeight: 700 }}>{scoreDisplayValue(score)}</td>
                  <td style={{ padding: 9 }}>{score.date}</td>
                </tr>
              ))}
              {allScores.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 14, color: '#64748b', textAlign: 'center' }}>No grade entries match current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:16 }}>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Class Avg</div><div style={{ fontSize:26, fontWeight:900, color:'#1e293b' }}>{classAvg !== null ? `${classAvg}%` : '—'}</div></div>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Doing Well+</div><div style={{ fontSize:26, fontWeight:900, color:'#4b6854' }}>{statusCounts.Excellent + statusCounts['Doing Well']}</div></div>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Needs Support</div><div style={{ fontSize:26, fontWeight:900, color:'#9f1239' }}>{statusCounts['Needs Support']}</div></div>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Watch</div><div style={{ fontSize:26, fontWeight:900, color:'#9a6a2a' }}>{statusCounts.Watch}</div></div>
        <div style={S.card}><div style={{ fontSize:11, color:'#64748b' }}>Missing</div><div style={{ fontSize:26, fontWeight:900, color:'#64748b' }}>{statusCounts.Missing}</div></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>
        <div style={S.card}>
          <div style={{ fontWeight:900, fontSize:15, marginBottom:12 }}>Class Student View</div>
          {latestByStudent.map(row => <div key={row.student.id} style={{ display:'grid', gridTemplateColumns:'1.2fr 0.6fr 1.2fr 0.8fr 0.7fr', gap:12, alignItems:'center', padding:'11px 0', borderTop:'1px solid #f0f1f6' }}>
            <div onClick={()=>openStudent(row.student, 'testScores')} style={{ cursor:'pointer' }}><div style={{ fontWeight:850, fontSize:13 }}>{row.student.name}</div><div style={{ fontSize:11, color:'#64748b' }}>{CLASSES.find(c=>c.id===STUDENT_CLASSES[row.student.id])?.name}</div></div>
            <div style={{ fontWeight:900, color:'#1e293b' }}>{row.avg !== null ? `${row.avg}%` : '—'}</div>
            <div>{row.latest ? <><div style={{ fontWeight:750, fontSize:12 }}>{row.latest.assessmentName}</div><div style={{ fontSize:11, color:'#64748b' }}>{row.latest.subject} · {row.latest.skill}</div></> : <span style={{ color:'#94a3b8', fontSize:12 }}>No scores</span>}</div>
            <div>{row.latest ? scoreDisplayValue(row.latest) : '—'}</div>
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

      {showBulkEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.48)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 980, maxHeight: '92vh', overflow: 'hidden', boxShadow: '0 24px 80px rgba(15,23,42,0.28)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Bulk Grade Entry</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{bulkVisibleStudents.length} students in current scope</div>
              </div>
              <button onClick={() => setShowBulkEntry(false)} style={{ border:'none', background:'#f4f5f8', borderRadius:'50%', width:30, height:30, cursor:'pointer' }}>×</button>
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
              <select value={bulkForm.teacher} onChange={e => updateBulkForm('teacher', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>
                {teacherOptions.map(name => <option key={name}>{name}</option>)}
              </select>
              <select value={bulkForm.subject} onChange={e => updateBulkForm('subject', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>
                {bulkSubjectOptions.map(option => <option key={option}>{option}</option>)}
              </select>
              <select value={bulkForm.skill} onChange={e => updateBulkForm('skill', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>
                {bulkSkillOptions.map(option => <option key={option}>{option}</option>)}
              </select>
              <input type="date" value={bulkForm.date} onChange={e => updateBulkForm('date', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} />

              <input value={bulkForm.assessmentName} onChange={e => updateBulkForm('assessmentName', e.target.value)} placeholder="Assessment name" style={{ gridColumn: 'span 2', padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <select value={bulkForm.scoreType} onChange={e => updateBulkForm('scoreType', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>
                <option value="points">Number score</option>
                <option value="rating">Skill rating</option>
              </select>
              {bulkForm.scoreType === 'points' ? (
                <input value={bulkForm.maxScore} onChange={e => updateBulkForm('maxScore', e.target.value)} placeholder="Max score" style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              ) : (
                <select value={bulkForm.rating} onChange={e => updateBulkForm('rating', e.target.value)} style={{ padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }}>
                  {SKILL_RATINGS.map(rating => <option key={rating}>{rating}</option>)}
                </select>
              )}

              <textarea value={bulkForm.notes} onChange={e => updateBulkForm('notes', e.target.value)} placeholder="Optional note for all entries" spellCheck lang="en" style={{ gridColumn: 'span 2', padding: 10, border:'1px solid #e5e7eb', borderRadius:8, minHeight: 42, resize: 'vertical' }} />
              <div style={{ display:'flex', gap: 8, alignItems: 'center', gridColumn: 'span 2' }}>
                <input value={bulkForm.fillAllScore} onChange={e => updateBulkForm('fillAllScore', e.target.value)} placeholder="Fill all with score" style={{ flex: 1, padding: 10, border:'1px solid #e5e7eb', borderRadius:8 }} />
                <button onClick={fillAllScores} style={S.btn('ghost')}>Fill All</button>
              </div>
            </div>

            <div style={{ maxHeight: '52vh', overflow: 'auto', padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 0.9fr 1fr', gap: 10, fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>
                <div>Student</div>
                <div>Entry Type</div>
                <div>{bulkForm.scoreType === 'points' ? 'Score' : 'Rating'}</div>
                <div>Quick status</div>
              </div>

              {bulkVisibleStudents.map(student => {
                const state = bulkStudentStates[student.id] || { mode: 'score', score: '' }
                return (
                  <div key={student.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 0.9fr 1fr', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #eef2f7' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{student.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{CLASSES.find(c => c.id === STUDENT_CLASSES[student.id])?.name || 'Unassigned class'}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
                      {[
                        { value: 'score', label: 'Scored', color: '#3f6f4f', bg: '#eefbf2', border: '#c7efd2' },
                        { value: 'missed', label: 'Missed', color: '#9a6a2a', bg: '#fff7ed', border: '#fed7aa' },
                        { value: 'absent', label: 'Absent', color: '#9f1239', bg: '#fff1f2', border: '#fecdd3' },
                      ].map(option => {
                        const isActive = state.mode === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setStudentBulkMode(student.id, option.value)}
                            style={{
                              padding: '8px 6px',
                              borderRadius: 8,
                              border: `1px solid ${isActive ? option.border : '#e5e7eb'}`,
                              background: isActive ? option.bg : '#ffffff',
                              color: isActive ? option.color : '#64748b',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>

                    {bulkForm.scoreType === 'points' ? (
                      <input value={state.score || ''} onChange={e => setStudentBulkScore(student.id, e.target.value)} disabled={state.mode !== 'score'} placeholder="Score" style={{ padding: 8, border:'1px solid #e5e7eb', borderRadius:8, background: state.mode !== 'score' ? '#f8fafc' : '#fff' }} />
                    ) : (
                      <div style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{state.mode === 'score' ? bulkForm.rating : 'N/A'}</div>
                    )}

                    <div style={{ fontSize: 12, color: state.mode === 'absent' ? '#9f1239' : state.mode === 'missed' ? '#9a6a2a' : '#4b6854', fontWeight: 700 }}>
                      {state.mode === 'score' ? 'Will save score' : state.mode === 'missed' ? 'Mark missed' : 'Mark absent'}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Missed/Absent entries are saved in each student score history with explicit status tags.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowBulkEntry(false)} style={S.btn('ghost')} disabled={bulkSaving}>Cancel</button>
                <button onClick={saveBulkScores} style={S.btn('primary')} disabled={bulkSaving}>{bulkSaving ? 'Saving...' : 'Save Bulk Grades'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
