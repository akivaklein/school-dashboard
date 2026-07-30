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
      enteredBy: userName || 'Staff',
      enteredAt: new Date().toISOString(),
      sourceContext: 'student-profile-single-entry',
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
  CLASS_DIVISION,
  ACADEMIC_AREAS,
  academicCatalog,
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
  const loggedInTeacher = (userName || '').trim() || initialTeacher
  const [classFilter, setClassFilter] = useState(role === 'teacher' && teacherClass ? teacherClass : 'all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState(role === 'teacher' ? userName : 'all')
  const [enteredByFilter, setEnteredByFilter] = useState('all')
  const [gradeSearch, setGradeSearch] = useState('')
  const [addStudentId, setAddStudentId] = useState(null)
  const [showBulkEntry, setShowBulkEntry] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkStudentStates, setBulkStudentStates] = useState({})
  const [bulkForm, setBulkForm] = useState({
    teacher: loggedInTeacher,
    subject: 'Math',
    skill: '2-digit',
    assessmentName: '',
    assessmentType: 'Quiz',
    date: new Date().toISOString().slice(0, 10),
    gradingMethod: 'points',
    maxScore: '100',
    rating: 'Good',
    letterGrade: 'B',
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

    const assignment = setupAssignments?.[loggedInTeacher]
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
    loggedInTeacher,
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

  const activeCatalogSubjects = (academicCatalog?.subjects || []).filter(subject => subject.active !== false)
  const selectedClassDivision = classFilter === 'all' ? null : (CLASS_DIVISION?.[classFilter] || null)

  const bulkSubjectOptions = activeCatalogSubjects
    .filter(subject => {
      const teacherMatch = !subject.teacherNames?.length || subject.teacherNames.includes(loggedInTeacher)
      const classMatch = classFilter === 'all' || !subject.classIds?.length || subject.classIds.includes(classFilter)
      const divisionMatch = !selectedClassDivision || !subject.divisionKeys?.length || subject.divisionKeys.includes(selectedClassDivision)
      return teacherMatch && classMatch && divisionMatch
    })
    .map(subject => subject.label)

  const selectedCatalogSubject = activeCatalogSubjects.find(subject => subject.label === bulkForm.subject)
  const bulkSkillOptions = (selectedCatalogSubject?.skills || [])
    .filter(skill => skill.active !== false)
    .map(skill => skill.label)

  const effectiveBulkSkillOptions = bulkSkillOptions.length > 0
    ? bulkSkillOptions
    : (getTeacherAcademicAreaMap(loggedInTeacher)[bulkForm.subject] || ['General'])

  useEffect(() => {
    setBulkForm(prev => {
      const next = { ...prev }
      if (next.teacher !== loggedInTeacher) {
        next.teacher = loggedInTeacher
      }

      if (!bulkSubjectOptions.length) return next

      if (!bulkSubjectOptions.includes(next.subject)) {
        next.subject = bulkSubjectOptions[0]
      }

      const skills = effectiveBulkSkillOptions
      if (skills.length > 0 && !skills.includes(next.skill)) {
        next.skill = skills[0]
      }

      if (next.gradingMethod === 'percentage') {
        next.maxScore = '100'
      }

      return next
    })
  }, [loggedInTeacher, bulkSubjectOptions, effectiveBulkSkillOptions])

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
      if (key === 'subject') {
        const catalogSubject = activeCatalogSubjects.find(subject => subject.label === value)
        const activeSkills = (catalogSubject?.skills || []).filter(skill => skill.active !== false).map(skill => skill.label)
        const fallbackSkills = getTeacherAcademicAreaMap(loggedInTeacher)[value] || ['General']
        const nextSkills = activeSkills.length ? activeSkills : fallbackSkills
        next.skill = nextSkills[0]
      }
      if (key === 'gradingMethod' && value === 'percentage') {
        next.maxScore = '100'
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
      [studentId]: (() => {
        const current = prev[studentId] || { mode: 'score', score: '' }
        const nextMode = current.mode === mode ? 'score' : mode
        return {
          ...current,
          mode: nextMode,
          score: nextMode === 'score' ? current.score : '',
        }
      })(),
    }))
  }

  function setStudentBulkScore(studentId, score) {
    setBulkStudentStates(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { mode: 'score' }),
        mode: 'score',
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

    const effectiveScoreType = bulkForm.gradingMethod === 'rating-scale' || bulkForm.gradingMethod === 'letter-grade'
      ? 'rating'
      : 'points'

    if (effectiveScoreType === 'points' && !bulkForm.maxScore) {
      alert('Enter max score for numeric bulk grading.')
      return
    }

    const payload = []

    for (const student of bulkVisibleStudents) {
      const state = bulkStudentStates[student.id] || { mode: 'score', score: '' }

      if (state.mode !== 'missed' && state.mode !== 'absent') {
        if (effectiveScoreType === 'points' && (state.score === '' || state.score === null || state.score === undefined)) {
          continue
        }
      }

      const attemptStatus = state.mode === 'absent' ? 'absent' : state.mode === 'missed' ? 'missed' : 'scored'
      const statusNote = attemptStatus === 'absent' ? '[Absent on assessment date]' : attemptStatus === 'missed' ? '[Missed assessment]' : ''
      const mergedNotes = [statusNote, bulkForm.notes].filter(Boolean).join(' ')
      const ratingFromLetter = bulkForm.letterGrade === 'A'
        ? 'Great'
        : bulkForm.letterGrade === 'B'
          ? 'Good'
          : bulkForm.letterGrade === 'C'
            ? 'Developing'
            : 'Weak'
      const numericMaxScore = bulkForm.gradingMethod === 'percentage' ? 100 : Number(bulkForm.maxScore)

      const entry = {
        id: `ts${Date.now()}-${student.id}`,
        teacher: loggedInTeacher,
        subject: bulkForm.subject,
        skill: bulkForm.skill,
        assessmentName: bulkForm.assessmentName,
        assessmentType: bulkForm.assessmentType,
        gradingMethod: bulkForm.gradingMethod,
        date: bulkForm.date,
        scoreType: attemptStatus === 'scored' ? effectiveScoreType : 'status',
        score: attemptStatus === 'scored' && effectiveScoreType === 'points' ? Number(state.score) : null,
        maxScore: attemptStatus === 'scored' && effectiveScoreType === 'points' ? numericMaxScore : null,
        rating: attemptStatus === 'scored' && effectiveScoreType === 'rating'
          ? (bulkForm.gradingMethod === 'letter-grade' ? ratingFromLetter : bulkForm.rating)
          : null,
        notes: mergedNotes,
        attemptStatus,
        enteredBy: userName || loggedInTeacher || 'Staff',
        enteredAt: new Date().toISOString(),
        sourceContext: 'academics-bulk-entry',
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
    .filter(score =>
      (teacherFilter === 'all' || score.teacher === teacherFilter)
      && (subjectFilter === 'all' || score.subject === subjectFilter)
      && (skillFilter === 'all' || score.skill === skillFilter)
      && (enteredByFilter === 'all' || (score.enteredBy || 'Unknown') === enteredByFilter)
    )
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
  const filterSubjectOptions = ['all', ...new Set((academicCatalog?.subjects || []).filter(subject => subject.active !== false).map(subject => subject.label))]
  const filterSkills = ['all', ...new Set((academicCatalog?.subjects || []).flatMap(subject => (subject.skills || []).filter(skill => skill.active !== false).map(skill => skill.label)))]
  const teacherFilterOptions = role === 'admin' ? ['all', ...teacherOptions] : []
  const enteredByFilterOptions = ['all', ...new Set(
    visibleStudents.flatMap(student => (student.testScores || []).map(score => score.enteredBy || 'Unknown'))
  )]
  const classScopeLabel = classFilter === 'all'
    ? 'All classes'
    : (CLASSES.find(c => c.id === classFilter)?.name || 'Selected class')
  const bulkProgressCount = bulkVisibleStudents.filter(student => {
    const state = bulkStudentStates[student.id] || { mode: 'score', score: '' }
    if (state.mode === 'absent' || state.mode === 'missed') return true
    if (bulkForm.gradingMethod === 'rating-scale' || bulkForm.gradingMethod === 'letter-grade') return true
    return state.score !== '' && state.score !== null && state.score !== undefined
  }).length

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 12, marginBottom:18, flexWrap: 'wrap' }}>
        <div><h1 style={{ fontSize:24, fontWeight:800, color:'#16243a', margin:'0 0 6px' }}>Academics and Grades</h1><div style={{ fontSize:13, color:'#64748b' }}>Class view for test scores and skill ratings</div></div>
        <button onClick={openBulkEntry} disabled={bulkVisibleStudents.length === 0} style={{ ...S.btn(bulkVisibleStudents.length ? 'primary' : 'ghost'), whiteSpace: 'nowrap' }}>Bulk Grade Entry</button>
      </div>

      <div style={{ ...S.card, marginBottom:16, display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
        {role === 'admin' && <select value={teacherFilter} onChange={e=>setTeacherFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>{teacherFilterOptions.map(option => <option key={option} value={option}>{option === 'all' ? 'All teachers' : option}</option>)}</select>}
        <select value={enteredByFilter} onChange={e=>setEnteredByFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>
          {enteredByFilterOptions.map(option => <option key={option} value={option}>{option === 'all' ? 'All entered by' : option}</option>)}
        </select>
        <select value={classFilter} onChange={e=>setClassFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}><option value="all">All classes</option>{CLASSES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={subjectFilter} onChange={e=>{setSubjectFilter(e.target.value); setSkillFilter('all')}} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>{filterSubjectOptions.map(x=><option key={x} value={x}>{x === 'all' ? 'All subjects' : x}</option>)}</select>
        <select value={skillFilter} onChange={e=>setSkillFilter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>{filterSkills.filter(x=> subjectFilter==='all' || x==='all' || (academicCatalog?.subjects || []).some(subject => subject.label === subjectFilter && (subject.skills || []).some(skill => skill.label === x && skill.active !== false))).map(x=><option key={x} value={x}>{x === 'all' ? 'All skills' : x}</option>)}</select>
      </div>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>Filterable Grades View</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {allScores.length} matching entries · Teacher: {teacherFilter === 'all' ? 'All' : teacherFilter} · Subject: {subjectFilter === 'all' ? 'All' : subjectFilter} · Entered by: {enteredByFilter === 'all' ? 'All' : enteredByFilter}
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
                <th style={{ padding: 9 }}>Entered By</th>
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
                  <td style={{ padding: 9 }}>{score.enteredBy || 'Unknown'}</td>
                  <td style={{ padding: 9 }}>{score.date}</td>
                </tr>
              ))}
              {allScores.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 14, color: '#64748b', textAlign: 'center' }}>No grade entries match current filters.</td>
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
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1040, height: 'min(92vh, 760px)', overflow: 'hidden', boxShadow: '0 24px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#12263f' }}>Bulk Grade Entry</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {classScopeLabel} · {bulkVisibleStudents.length} students · {bulkProgressCount}/{bulkVisibleStudents.length} ready
                </div>
              </div>
              <button onClick={() => setShowBulkEntry(false)} style={{ border: '1px solid #d9e2ec', background: '#f8fafc', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#475569', fontWeight: 700 }}>×</button>
            </div>

            <div style={{ padding: 14, borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, flexShrink: 0 }}>
              <div style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Teacher
                <div style={{ padding: '9px 10px', border: '1px solid #d7dee7', borderRadius: 8, background: '#f8fafc', color: '#1e293b', fontSize: 13, fontWeight: 700 }}>
                  {loggedInTeacher}
                </div>
              </div>

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Subject
                <select value={bulkForm.subject} onChange={e => updateBulkForm('subject', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                  {bulkSubjectOptions.map(option => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Skill / Topic
                <select value={bulkForm.skill} onChange={e => updateBulkForm('skill', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                  {effectiveBulkSkillOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Class
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                  <option value="all">All classes</option>
                  {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Assessment Name
                <input value={bulkForm.assessmentName} onChange={e => updateBulkForm('assessmentName', e.target.value)} placeholder="Unit Test 3" spellCheck lang="en" style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8 }} />
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Assessment Type
                <select value={bulkForm.assessmentType} onChange={e => updateBulkForm('assessmentType', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                  <option value="Quiz">Quiz</option>
                  <option value="Test">Test</option>
                  <option value="Checkpoint">Checkpoint</option>
                  <option value="Homework">Homework</option>
                  <option value="Observation">Observation</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Date
                <input type="date" value={bulkForm.date} onChange={e => updateBulkForm('date', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8 }} />
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Grading Method
                <select value={bulkForm.gradingMethod} onChange={e => updateBulkForm('gradingMethod', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                  <option value="points">Points</option>
                  <option value="percentage">Percentage</option>
                  <option value="letter-grade">Letter Grade</option>
                  <option value="rating-scale">Rating Scale</option>
                </select>
              </label>

              {bulkForm.gradingMethod === 'rating-scale' && (
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  Rating Scale
                  <select value={bulkForm.rating} onChange={e => updateBulkForm('rating', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                    {SKILL_RATINGS.map(rating => <option key={rating}>{rating}</option>)}
                  </select>
                </label>
              )}

              {bulkForm.gradingMethod === 'letter-grade' && (
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  Letter Grade
                  <select value={bulkForm.letterGrade} onChange={e => updateBulkForm('letterGrade', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </label>
              )}

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Maximum Score
                <input value={bulkForm.maxScore} onChange={e => updateBulkForm('maxScore', e.target.value)} disabled={bulkForm.gradingMethod === 'rating-scale' || bulkForm.gradingMethod === 'letter-grade'} placeholder="100" style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: bulkForm.gradingMethod === 'rating-scale' || bulkForm.gradingMethod === 'letter-grade' ? '#f8fafc' : '#fff' }} />
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700, gridColumn: '1 / -1' }}>
                Optional Note
                <textarea value={bulkForm.notes} onChange={e => updateBulkForm('notes', e.target.value)} placeholder="Optional note for all entries" spellCheck lang="en" style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, minHeight: 56, resize: 'vertical' }} />
              </label>

              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #eef2f7', paddingTop: 10, display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap' }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700, minWidth: 160 }}>
                  Fill All
                  <input value={bulkForm.fillAllScore} onChange={e => updateBulkForm('fillAllScore', e.target.value)} placeholder={(bulkForm.gradingMethod === 'rating-scale' || bulkForm.gradingMethod === 'letter-grade') ? 'Not used for this method' : 'Score for all students'} disabled={bulkForm.gradingMethod === 'rating-scale' || bulkForm.gradingMethod === 'letter-grade'} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: (bulkForm.gradingMethod === 'rating-scale' || bulkForm.gradingMethod === 'letter-grade') ? '#f8fafc' : '#fff' }} />
                </label>
                <button onClick={fillAllScores} style={S.btn('primary')} disabled={bulkForm.gradingMethod === 'rating-scale' || bulkForm.gradingMethod === 'letter-grade'}>Apply to All</button>
              </div>
            </div>

            <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 0.7fr) minmax(0, 1fr)', gap: 10, fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
              <div>Student</div>
              <div>{bulkForm.gradingMethod === 'points' || bulkForm.gradingMethod === 'percentage' ? 'Score' : 'Result'}</div>
              <div>Exceptions</div>
            </div>

            <div style={{ overflowY: 'auto', padding: '0 14px', minHeight: 0, flex: 1 }}>
              {bulkVisibleStudents.map(student => {
                const state = bulkStudentStates[student.id] || { mode: 'score', score: '' }
                const isScoreActive = state.mode !== 'missed' && state.mode !== 'absent'
                return (
                  <div key={student.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 0.7fr) minmax(0, 1fr)', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid #eef2f7' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{CLASSES.find(c => c.id === STUDENT_CLASSES[student.id])?.name || 'Unassigned class'}</div>
                    </div>

                    {bulkForm.gradingMethod === 'points' || bulkForm.gradingMethod === 'percentage' ? (
                      <input value={state.score || ''} onChange={e => setStudentBulkScore(student.id, e.target.value)} disabled={!isScoreActive} placeholder={isScoreActive ? 'Score' : '—'} style={{ width: '100%', padding: 8, border: '1px solid #d7dee7', borderRadius: 8, background: !isScoreActive ? '#f8fafc' : '#fff' }} />
                    ) : (
                      <div style={{ fontSize: 12, color: isScoreActive ? '#334155' : '#94a3b8', fontWeight: 700, padding: '8px 6px' }}>
                        {!isScoreActive ? '—' : bulkForm.gradingMethod === 'letter-grade' ? bulkForm.letterGrade : bulkForm.rating}
                      </div>
                    )}

                    <div style={{ display: 'inline-flex', gap: 5, alignItems: 'center', flexWrap: 'nowrap' }}>
                      {[
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
                              padding: '6px 8px',
                              borderRadius: 7,
                              border: `1px solid ${isActive ? option.border : '#e5e7eb'}`,
                              background: isActive ? option.bg : '#ffffff',
                              color: isActive ? option.color : '#64748b',
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: 'pointer',
                              minWidth: 52,
                            }}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: 14, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Missed and absent entries are saved in score history with status tags.
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
