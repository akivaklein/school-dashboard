import { useEffect, useMemo, useState } from 'react'
import { resolveStudentClassId } from './dashboardData'

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
  onSaveGradeEntry = null,
}) {
  const teacherOptions = Array.from(new Set([...(academicTeacherOptions || []), ...Object.keys(ACADEMIC_AREAS || {})].filter(Boolean)))
  const initialTeacher = userName && teacherOptions.includes(userName) ? userName : teacherOptions[0] || DEFAULT_ACADEMIC_TEACHER
  const [showAdd, setShowAdd] = useState(false)
  const [selectedScore, setSelectedScore] = useState(null)
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

  async function addScore() {
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
    const previousScores = s.testScores || []
    const updatedScores = [entry, ...(s.testScores || [])]
    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, testScores: updatedScores } : x))

    // Use grade_entries path when available (syncs in realtime to other sessions)
    let saveOk = true
    if (onSaveGradeEntry) {
      saveOk = await onSaveGradeEntry(s.id, entry)
    } else if (persistStudentFields) {
      saveOk = await persistStudentFields(s.id, { testScores: updatedScores })
    }

    if (!saveOk) {
      setStudents(prev => prev.map(x => x.id === s.id ? { ...x, testScores: previousScores } : x))
      alert('Unable to save this score. Please try again.')
      return
    }

    setShowAdd(false)
    setForm(prev => ({ ...prev, assessmentName: '', score: '', notes: '' }))
  }

  const sortedScores = useMemo(
    () => [...scores].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    [scores],
  )

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
        {sortedScores.map(score => {
          const status = scoreStatusValue(score)
          return <button key={score.id} onClick={() => setSelectedScore(score)} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.8fr 0.7fr auto', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f0f1f6', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', width: '100%', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>{score.assessmentName}</div><div style={{ fontSize: 11, color: '#64748b' }}>{score.date} · {score.teacher}</div></div>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>{score.subject}</div><div style={{ fontSize: 11, color: '#64748b' }}>{score.skill}</div></div>
            <div style={{ fontWeight: 700, color: '#263241' }}>{scoreDisplayValue(score)}</div>
            <div><span style={S.badge(academicStatusColor(status), academicStatusColor(status)+'15')}>{status}</span></div>
            <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: 15 }}>›</div>
            {score.notes && <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#64748b', background: '#ffffff', borderRadius: 8, padding: '8px 10px' }}>{score.notes}</div>}
          </button>
        })}
      </div>

      {selectedScore && (
        <>
          <div onClick={() => setSelectedScore(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1190 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: '#fff', boxShadow: '-6px 0 30px rgba(15,23,42,0.2)', zIndex: 1200, display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#0f172a', color: '#fff', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedScore.assessmentName || 'Score Details'}</div>
                <div style={{ fontSize: 11, opacity: 0.82, marginTop: 2 }}>{selectedScore.subject} · {selectedScore.skill}</div>
              </div>
              <button onClick={() => setSelectedScore(null)} style={{ border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.14)', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>×</button>
            </div>
            <div style={{ padding: 18, overflowY: 'auto', display: 'grid', gap: 10 }}>
              {[
                { label: 'Teacher', value: selectedScore.teacher || '—' },
                { label: 'Subject', value: selectedScore.subject || '—' },
                { label: 'Skill', value: selectedScore.skill || '—' },
                { label: 'Date', value: selectedScore.date || '—' },
                { label: 'Score Type', value: selectedScore.scoreType || '—' },
                { label: 'Result', value: scoreDisplayValue(selectedScore) },
                { label: 'Status', value: scoreStatusValue(selectedScore) },
                { label: 'Entered By', value: selectedScore.enteredBy || '—' },
                { label: 'Entry Source', value: selectedScore.sourceContext || 'manual' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #eef2f7', paddingBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
              {selectedScore.notes && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', padding: '10px 12px', marginTop: 4 }}>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Teacher Note</div>
                  <div style={{ fontSize: 12.5, color: '#334155' }}>{selectedScore.notes}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

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
  onSaveGradeEntry = null,
  onSaveGradeEntries = null,
}) {
  const teacherOptions = Array.from(new Set([...(academicTeacherOptions || []), ...Object.keys(ACADEMIC_AREAS)]))
  const initialTeacher = role === 'teacher' && userName && teacherOptions.includes(userName)
    ? userName
    : teacherOptions[0] || (academicTeacherOptions?.[0] || 'Rabbi Abowitz')
  const loggedInTeacher = (userName || '').trim() || initialTeacher
  const [classFilter, setClassFilter] = useState(role === 'teacher' && teacherClass ? teacherClass : 'all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState(role === 'teacher' || role === 'rebbe' ? (userName || 'all') : 'all')
  const [enteredByFilter, setEnteredByFilter] = useState('all')
  const [gradeSearch, setGradeSearch] = useState('')
  const [addStudentId, setAddStudentId] = useState(null)
  const [showBulkEntry, setShowBulkEntry] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [selectedScore, setSelectedScore] = useState<Record<string, any> | null>(null)
  const [showAddSingle, setShowAddSingle] = useState(false)
  const [addSingleStudentId, setAddSingleStudentId] = useState<number | null>(null)
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
          : teacherAssignedClassIds?.length
            ? students.filter(s => teacherAssignedClassIds.includes(resolveStudentClassId(s)))
            : teacherClass
              ? students.filter(s => resolveStudentClassId(s) === teacherClass)
              : []
      )
    : students
  const visibleStudents = scopedStudents.filter(s => classFilter === 'all' || resolveStudentClassId(s) === classFilter)

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
      if (classFilter !== 'all' && resolveStudentClassId(student) !== classFilter) {
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
        entry,
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

    // Use the dedicated grade_entries path when available (realtime sync)
    if (onSaveGradeEntries) {
      const gradePayload = payload.map(item => ({ studentId: item.studentId, score: item.entry }))
      const ok = await onSaveGradeEntries(gradePayload)
      if (!ok) {
        setBulkSaving(false)
        alert('Some bulk scores could not be saved. Please try again.')
        return
      }
    } else {
      // Fallback: write to students.test_scores JSONB only
      setStudents(prev => prev.map(student => {
        const update = payload.find(item => item.studentId === student.id)
        return update ? { ...student, testScores: update.nextScores } : student
      }))
      if (persistStudentFields) {
        const saveResults = await Promise.all(
          payload.map(item => persistStudentFields(item.studentId, { testScores: item.nextScores }))
        )
        if (!saveResults.every(Boolean)) {
          setStudents(prev => prev.map(student => {
            if (!Object.prototype.hasOwnProperty.call(previousById, student.id)) return student
            return { ...student, testScores: previousById[student.id] }
          }))
          setBulkSaving(false)
          alert('Some bulk scores could not be saved to Supabase.')
          return
        }
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

  function pctToLetterGrade(pct: number | null): string {
    if (pct === null || pct === undefined) return '—'
    if (pct >= 97) return 'A+'; if (pct >= 93) return 'A'; if (pct >= 90) return 'A-'
    if (pct >= 87) return 'B+'; if (pct >= 83) return 'B'; if (pct >= 80) return 'B-'
    if (pct >= 77) return 'C+'; if (pct >= 73) return 'C'; if (pct >= 70) return 'C-'
    if (pct >= 67) return 'D+'; if (pct >= 60) return 'D'; return 'F'
  }
  function letterGradeColor(grade: string): string {
    if (grade.startsWith('A')) return '#16a34a'
    if (grade.startsWith('B')) return '#2563eb'
    if (grade.startsWith('C')) return '#ca8a04'
    return '#dc2626'
  }
  function renderScoreBadge(score: Record<string, any>) {
    if (score.attemptStatus === 'missed' || score.scoreType === 'status') {
      return <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>Missed</span>
    }
    if (score.attemptStatus === 'absent') {
      return <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>Absent</span>
    }
    if (score.scoreType === 'rating') {
      const colors: Record<string, string> = { Great: '#16a34a', Good: '#2563eb', Developing: '#ca8a04', Weak: '#dc2626' }
      const c = colors[score.rating] || '#64748b'
      return <span style={{ background: c + '18', color: c, borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12, border: `1px solid ${c}33` }}>{score.rating}</span>
    }
    if (score.scoreType === 'points' && score.maxScore) {
      const pct = Math.round((score.score / score.maxScore) * 100)
      const letter = pctToLetterGrade(pct)
      const c = letterGradeColor(letter)
      return (
        <span style={{ background: c + '18', color: c, borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12, border: `1px solid ${c}33`, whiteSpace: 'nowrap' }}>
          {score.score}/{score.maxScore} · {letter}
        </span>
      )
    }
    return <span style={{ color: '#64748b', fontSize: 12 }}>—</span>
  }
  function getClassName(studentId: number): string {
    const student = (students || []).find(item => Number(item.id) === Number(studentId)) || { id: studentId }
    const cls = CLASSES.find(c => c.id === resolveStudentClassId(student))
    return cls?.name || '—'
  }

  const sortedScores = allScores.slice().sort((a, b) => b.date.localeCompare(a.date))
  const subjectLabels: string[] = (academicCatalog?.subjects || [])
    .filter((subject: { active?: boolean }) => subject.active !== false)
    .map((subject: { label?: string }) => String(subject.label || ''))
  const allSubjectChips = ['all', ...Array.from(new Set(subjectLabels)).sort()]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#16243a', margin: '0 0 4px' }}>Grades</h1>
          <div style={{ fontSize: 12, color: '#64748b' }}>{allScores.length} records</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => alert('Import — coming soon')} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#334155', fontWeight: 600 }}>↑ Import</button>
          <button onClick={openBulkEntry} disabled={bulkVisibleStudents.length === 0} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: bulkVisibleStudents.length ? 'pointer' : 'default', opacity: bulkVisibleStudents.length ? 1 : 0.6 }}>✎ New Marks</button>
          <button onClick={() => setShowAddSingle(true)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Grade</button>
        </div>
      </div>

      {/* Search + Teacher/Class dropdowns */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={gradeSearch}
          onChange={e => { setGradeSearch(e.target.value) }}
          placeholder="Search student..."
          spellCheck={false}
          style={{ flex: '1 1 220px', padding: '9px 12px', borderRadius: 9, border: '1px solid #e2e8f0', fontSize: 13 }}
        />
        {role === 'admin' && (
          <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', minWidth: 140 }}>
            <option value="all">All</option>
            {teacherOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {role === 'admin' && (
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', minWidth: 140 }}>
            <option value="all">All Classes</option>
            {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Subject filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {allSubjectChips.map(subject => (
          <button
            key={subject}
            onClick={() => { setSubjectFilter(subject); setSkillFilter('all') }}
            style={{
              padding: '5px 14px',
              borderRadius: 99,
              border: `1.5px solid ${subjectFilter === subject ? '#0f172a' : '#e2e8f0'}`,
              background: subjectFilter === subject ? '#0f172a' : '#fff',
              color: subjectFilter === subject ? '#fff' : '#334155',
              fontSize: 13,
              fontWeight: subjectFilter === subject ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {subject === 'all' ? 'All' : subject}
          </button>
        ))}
      </div>

      {/* Grades table */}
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '11px 16px', fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teacher</th>
                <th style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {sortedScores.map(score => (
                <tr
                  key={`${score.id}-${score.studentId}`}
                  onClick={() => setSelectedScore(score)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{score.studentName}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{getClassName(score.studentId)}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>{score.subject}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>{score.assessmentType || 'Quiz'}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>{renderScoreBadge(score)}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{score.date}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{score.teacher || '—'}</td>
                  <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: 16 }}>›</td>
                </tr>
              ))}
              {sortedScores.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No grade entries match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade detail panel */}
      {selectedScore && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: '#fff', boxShadow: '-4px 0 32px rgba(15,23,42,0.14)', zIndex: 900, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: '#0f172a', padding: '18px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedScore.assessmentName || 'Grade Detail'}</div>
              <div style={{ fontSize: 12, opacity: 0.78, marginTop: 2 }}>{selectedScore.subject} · {selectedScore.skill}</div>
            </div>
            <button onClick={() => setSelectedScore(null)} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              {renderScoreBadge({ ...selectedScore, _large: true })}
            </div>
            {[
              { label: 'Student', value: selectedScore.studentName },
              { label: 'Class', value: getClassName(selectedScore.studentId) },
              { label: 'Teacher', value: selectedScore.teacher },
              { label: 'Subject', value: selectedScore.subject },
              { label: 'Skill / Topic', value: selectedScore.skill },
              { label: 'Assessment Type', value: selectedScore.assessmentType || '—' },
              { label: 'Date', value: selectedScore.date },
              { label: 'Entered By', value: selectedScore.enteredBy || '—' },
              ...(selectedScore.scoreType === 'points' && selectedScore.maxScore ? [
                { label: 'Score', value: `${selectedScore.score} / ${selectedScore.maxScore}` },
                { label: 'Percentage', value: `${Math.round((selectedScore.score / selectedScore.maxScore) * 100)}%` },
                { label: 'Letter Grade', value: pctToLetterGrade(Math.round((selectedScore.score / selectedScore.maxScore) * 100)) },
              ] : []),
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
              </div>
            ))}
            {selectedScore.notes && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>TEACHER COMMENT</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{selectedScore.notes}</div>
              </div>
            )}
            <button
              onClick={() => { const s = students.find(x => x.id === selectedScore.studentId); if (s) { openStudent(s, 'testScores'); setSelectedScore(null) } }}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}
            >
              Open Student Profile →
            </button>
          </div>
        </div>
      )}
      {selectedScore && <div onClick={() => setSelectedScore(null)} style={{ position: 'fixed', inset: 0, zIndex: 899 }} />}

      {/* Add single grade modal */}
      {showAddSingle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(15,23,42,0.28)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Add Grade</div>
              <button onClick={() => setShowAddSingle(false)} style={{ border: 'none', background: '#f4f5f8', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 700 }}>×</button>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>STUDENT</div>
                <select value={addSingleStudentId ?? ''} onChange={e => setAddSingleStudentId(Number(e.target.value))} style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                  <option value="">Choose student...</option>
                  {visibleStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({getClassName(s.id)})</option>)}
                </select>
              </div>
              <button
                disabled={!addSingleStudentId}
                onClick={() => {
                  const s = students.find(x => x.id === addSingleStudentId)
                  if (s) { openStudent(s, 'testScores'); setShowAddSingle(false) }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: addSingleStudentId ? '#0f172a' : '#e2e8f0', color: addSingleStudentId ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: addSingleStudentId ? 'pointer' : 'default' }}
              >
                Open Student to Add Grade
              </button>
              <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>Grade entry uses the student profile to maintain full academic history.</div>
            </div>
          </div>
        </div>
      )}

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
                      <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{CLASSES.find(c => c.id === resolveStudentClassId(student))?.name || 'Unassigned class'}</div>
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
