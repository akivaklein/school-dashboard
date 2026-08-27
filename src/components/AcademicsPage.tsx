import { useEffect, useMemo, useState } from 'react'
import { isLeadershipRole } from '../utils/permissions'
import { resolveStudentClassId } from './dashboardData'
import {
  buildLatestSessionRows,
  buildOverallProgressRows,
  buildStudentSubjectHistory,
  flattenStudentScores,
  type GradeStudent,
  getGradeSessions,
  getIncompleteBulkStudents,
} from './academicsReviewUtils'
import {
  archiveRecord,
  isArchivedRecord,
  isDeletedRecord,
  permanentlyDeleteRecord,
  restoreArchivedRecord,
} from '../utils/archiveRecord'

type AcademicCatalogSkill = {
  id: string
  label: string
  active?: boolean
  category?: string
}

type AcademicCatalogSubject = {
  id: string
  label: string
  active?: boolean
  divisionKeys?: string[]
  classIds?: string[]
  teacherNames?: string[]
  skills?: AcademicCatalogSkill[]
}

const isNonEmptyString = (value: string | null | undefined): value is string => Boolean(value)

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
  RATING_SCORE,
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
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState(role === 'teacher' || role === 'rebbe' ? (userName || 'all') : 'all')
  const [enteredByFilter, setEnteredByFilter] = useState('all')
  const [showAllScores, setShowAllScores] = useState(false)
  const [reviewMode, setReviewMode] = useState<'latest' | 'overall' | 'all'>('latest')
  const [sessionFilter, setSessionFilter] = useState('latest')
  const [gradeSearch, setGradeSearch] = useState('')
  const [addStudentId, setAddStudentId] = useState(null)
  const [showBulkEntry, setShowBulkEntry] = useState(false)
  const [bulkHeaderCollapsed, setBulkHeaderCollapsed] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [selectedScore, setSelectedScore] = useState<Record<string, any> | null>(null)
  const [selectedReviewStudent, setSelectedReviewStudent] = useState<{ student: GradeStudent; subject: string } | null>(null)
  const [showAddSingle, setShowAddSingle] = useState(false)
  const [showScoreArchive, setShowScoreArchive] = useState(false)
  const [addSingleStudentId, setAddSingleStudentId] = useState<number | null>(null)
  const [bulkStudentStates, setBulkStudentStates] = useState({})
  const [bulkCompletionMessage, setBulkCompletionMessage] = useState('')
  const [bulkForm, setBulkForm] = useState({
    teacher: loggedInTeacher,
    subject: 'Math',
    category: 'all',
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

    const assignedStudents = scopedStudents.filter(student => {
      const id = Number(student.id)
      if (!assignedIds.has(id)) return false
      if (classFilter !== 'all' && resolveStudentClassId(student) !== classFilter) {
        return false
      }
      return true
    })

    return assignedStudents.length > 0 ? assignedStudents : visibleStudents
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

  const activeCatalogSubjects = ((academicCatalog?.subjects || []) as AcademicCatalogSubject[]).filter(subject => subject.active !== false)
  const selectedClassDivision = classFilter === 'all' ? null : (CLASS_DIVISION?.[classFilter] || null)
  const effectiveTeacherForBulk = isLeadershipRole(role) ? bulkForm.teacher : loggedInTeacher

  const catalogBulkSubjectOptions = activeCatalogSubjects
    .filter(subject => {
      const teacherMatch = isLeadershipRole(role) ? true : !subject.teacherNames?.length || subject.teacherNames.includes(effectiveTeacherForBulk)
      const classMatch = classFilter === 'all' || !subject.classIds?.length || subject.classIds.includes(classFilter)
      const divisionMatch = !selectedClassDivision || !subject.divisionKeys?.length || subject.divisionKeys.includes(selectedClassDivision)
      return teacherMatch && classMatch && divisionMatch
    })
    .map(subject => subject.label)
  const fallbackBulkSubjectOptions = Object.keys(getTeacherAcademicAreaMap(effectiveTeacherForBulk))
  const bulkSubjectOptions = catalogBulkSubjectOptions.length > 0 ? catalogBulkSubjectOptions : fallbackBulkSubjectOptions

  const selectedCatalogSubject = activeCatalogSubjects.find(subject => subject.label === bulkForm.subject)
  const bulkCategorySkills = (selectedCatalogSubject?.skills || []).filter(skill => skill.active !== false)
  const bulkCategoryOptions = ['all', ...new Set(bulkCategorySkills.map(skill => skill.category).filter(isNonEmptyString))]
  const bulkSkillOptions = bulkCategorySkills
    .filter(skill => bulkForm.category === 'all' || (skill.category || '') === bulkForm.category)
    .map(skill => skill.label)

  const effectiveBulkSkillOptions = bulkSkillOptions.length > 0
    ? bulkSkillOptions
    : (getTeacherAcademicAreaMap(effectiveTeacherForBulk)[bulkForm.subject] || ['General'])

  useEffect(() => {
    setBulkForm(prev => {
      const next = { ...prev }
      if (!isLeadershipRole(role) && next.teacher !== loggedInTeacher) {
        next.teacher = loggedInTeacher
      }

      if (bulkSubjectOptions.length > 0 && !bulkSubjectOptions.includes(next.subject)) {
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
  }, [role, loggedInTeacher, bulkForm.teacher, bulkSubjectOptions, effectiveBulkSkillOptions])

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
        next.category = 'all'
        const catalogSubject = activeCatalogSubjects.find(subject => subject.label === value)
        const activeSkills = (catalogSubject?.skills || []).filter(skill => skill.active !== false).map(skill => skill.label)
        const fallbackSkills = getTeacherAcademicAreaMap(loggedInTeacher)[value] || ['General']
        const nextSkills = activeSkills.length ? activeSkills : fallbackSkills
        next.skill = nextSkills[0]
      }
      if (key === 'category') {
        const catalogSubject = activeCatalogSubjects.find(subject => subject.label === next.subject)
        const categorySkills = (catalogSubject?.skills || [])
          .filter(skill => skill.active !== false && (value === 'all' || (skill.category || '') === value))
          .map(skill => skill.label)
        if (categorySkills.length) next.skill = categorySkills[0]
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
    setBulkCompletionMessage('')
    setShowBulkEntry(true)
  }

  function closeBulkEntry() {
    const incompleteStudents = getIncompleteBulkStudents(bulkVisibleStudents, bulkStudentStates, bulkForm.gradingMethod)
    const hasStartedSession = bulkProgressCount > 0 || Boolean(bulkForm.assessmentName.trim())

    if (hasStartedSession && incompleteStudents.length > 0) {
      setBulkCompletionMessage(`${incompleteStudents.length} active student${incompleteStudents.length === 1 ? '' : 's'} still need a grade, Absent, or Missing result before leaving this grading session.`)
      return
    }

    setShowBulkEntry(false)
    setBulkCompletionMessage('')
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

    const incompleteStudents = getIncompleteBulkStudents(bulkVisibleStudents, bulkStudentStates, bulkForm.gradingMethod)
    if (incompleteStudents.length > 0) {
      setBulkCompletionMessage(`${incompleteStudents.length} active student${incompleteStudents.length === 1 ? '' : 's'} still need a grade, Absent, or Missing result.`)
      return
    }

    const payload = []

    for (const student of bulkVisibleStudents) {
      const state = bulkStudentStates[student.id] || { mode: 'score', score: '' }

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
        rating: attemptStatus === 'scored' && effectiveScoreType === 'rating' ? String(state.score || '') : null,
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
    .filter(score => !isArchivedRecord(score) && !isDeletedRecord(score))
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
  const filterSubjectOptions = ['all', ...new Set(((academicCatalog?.subjects || []) as AcademicCatalogSubject[]).filter(subject => subject.active !== false).map(subject => subject.label))]
  const activeFilterSubjectSkills = subjectFilter === 'all'
    ? []
    : ((academicCatalog?.subjects || []) as AcademicCatalogSubject[])
        .filter(subject => subject.active !== false && subject.label === subjectFilter)
        .flatMap(subject => (subject.skills || []).filter(skill => skill.active !== false))
  const filterCategories = ['all', ...new Set(activeFilterSubjectSkills.map(skill => skill.category).filter(isNonEmptyString))]
  const filterSkills = subjectFilter === 'all'
    ? ['all']
    : ['all', ...new Set(
        activeFilterSubjectSkills
          .filter(skill => categoryFilter === 'all' || (skill.category || '') === categoryFilter)
          .map(skill => skill.label)
      )]
  const teacherFilterOptions = isLeadershipRole(role) ? ['all', ...teacherOptions] : []
  const enteredByFilterOptions = ['all', ...new Set(
    visibleStudents.flatMap(student => (student.testScores || []).map(score => score.enteredBy || 'Unknown'))
  )]
  const classScopeLabel = classFilter === 'all'
    ? 'All classes'
    : (CLASSES.find(c => c.id === classFilter)?.name || 'Selected class')
  const bulkProgressCount = bulkVisibleStudents.filter(student => {
    return !getIncompleteBulkStudents([student], bulkStudentStates, bulkForm.gradingMethod).length
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
    if (score.attemptStatus === 'absent') {
      return <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>Absent</span>
    }
    if (score.attemptStatus === 'missed' || score.scoreType === 'status') {
      return <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>Missed</span>
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

  function updateStudentScoreArchive(studentId, scoreId, updater) {
    const student = students.find(item => Number(item.id) === Number(studentId))
    if (!student) return

    const nextScores = (student.testScores || []).map(score => (
      String(score.id) === String(scoreId) ? updater(score) : score
    ))
    setStudents(prev => prev.map(item => Number(item.id) === Number(studentId) ? { ...item, testScores: nextScores } : item))
    if (persistStudentFields) {
      persistStudentFields(studentId, { testScores: nextScores })
    }
  }

  function archiveSelectedScore() {
    if (!selectedScore) return
    if (!window.confirm('Are you sure you want to delete this?')) return
    updateStudentScoreArchive(selectedScore.studentId, selectedScore.id, score => archiveRecord(score, userName || loggedInTeacher || 'Staff'))
    setSelectedScore(null)
  }

  function restoreScore(studentId, scoreId) {
    updateStudentScoreArchive(studentId, scoreId, score => restoreArchivedRecord(score))
  }

  function permanentlyDeleteScore(studentId, scoreId) {
    if (!window.confirm('Are you sure you want to permanently delete this?')) return
    updateStudentScoreArchive(studentId, scoreId, score => permanentlyDeleteRecord(score))
  }

  const archivedScores = visibleStudents.flatMap(student => (
    (student.testScores || [])
      .filter(score => isArchivedRecord(score) && !isDeletedRecord(score))
      .map(score => ({ ...score, studentId: student.id, studentName: student.name }))
  ))
  const archivedScoreCount = archivedScores.length

  const sortedScores = (() => {
    const sorted = allScores.slice().sort((a, b) => b.date.localeCompare(a.date))
    if (showAllScores) return sorted
    const seenStudents = new Set()
    return sorted.filter(score => {
      if (seenStudents.has(score.studentId)) return false
      seenStudents.add(score.studentId)
      return true
    })
  })()
  const subjectLabels: string[] = (academicCatalog?.subjects || [])
    .filter((subject: { active?: boolean }) => subject.active !== false)
    .map((subject: { label?: string }) => String(subject.label || ''))
  const allSubjectChips = ['all', ...Array.from(new Set(subjectLabels)).sort()]
  const reviewSubject = subjectFilter === 'all' ? (allSubjectChips.find(subject => subject !== 'all') || '') : subjectFilter
  const reviewScores = flattenStudentScores(visibleStudents)
    .filter(score => (
      (teacherFilter === 'all' || score.teacher === teacherFilter) &&
      (enteredByFilter === 'all' || (score.enteredBy || 'Unknown') === enteredByFilter)
    ))
  const sessionOptions = getGradeSessions(reviewScores.filter(score => (
    (subjectFilter === 'all' || score.subject === subjectFilter) &&
    (skillFilter === 'all' || score.skill === skillFilter)
  )))
  const latestReview = buildLatestSessionRows({
    students: visibleStudents,
    scores: reviewScores,
    classFilter,
    subjectFilter,
    skillFilter,
    sessionKey: sessionFilter,
  })
  const overallRows = reviewSubject
    ? buildOverallProgressRows({ students: visibleStudents, subject: reviewSubject, skillFilter, ratingScore: RATING_SCORE })
    : []
  const reviewHistory = selectedReviewStudent
    ? buildStudentSubjectHistory(selectedReviewStudent.student, selectedReviewStudent.subject, skillFilter)
    : []

  useEffect(() => {
    if (sessionFilter === 'latest') return
    if (!sessionOptions.some(session => session.key === sessionFilter)) {
      setSessionFilter('latest')
    }
  }, [sessionFilter, sessionOptions])

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
          <button onClick={() => setShowScoreArchive(true)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#334155', fontWeight: 600 }}>Archive/Trash ({archivedScoreCount})</button>
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
        {isLeadershipRole(role) && (
          <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', minWidth: 140 }}>
            <option value="all">All</option>
            {teacherOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {isLeadershipRole(role) && (
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
            onClick={() => { setSubjectFilter(subject); setCategoryFilter('all'); setSkillFilter('all') }}
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

      {/* Category dropdown — appears once a subject has categorized skills */}
      {subjectFilter !== 'all' && filterCategories.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: -8 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{subjectFilter} category:</span>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setSkillFilter('all') }}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', minWidth: 180 }}
          >
            {filterCategories.map(category => <option key={category} value={category}>{category === 'all' ? 'All Categories' : category}</option>)}
          </select>
        </div>
      )}

      {/* Skill/topic dropdown — appears once a specific subject is chosen */}
      {subjectFilter !== 'all' && filterSkills.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: -8 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{subjectFilter} skill:</span>
          <select
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', minWidth: 180 }}
          >
            {filterSkills.map(skill => <option key={skill} value={skill}>{skill === 'all' ? 'All Skills' : skill}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { key: 'latest', label: 'Latest Results' },
          { key: 'overall', label: 'Overall Progress' },
          { key: 'all', label: 'All Entries' },
        ].map(option => (
          <button
            key={option.key}
            onClick={() => setReviewMode(option.key as 'latest' | 'overall' | 'all')}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: `1px solid ${reviewMode === option.key ? '#0f172a' : '#e2e8f0'}`,
              background: reviewMode === option.key ? '#0f172a' : '#fff',
              color: reviewMode === option.key ? '#fff' : '#334155',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        ))}
        {reviewMode === 'latest' && sessionOptions.length > 0 && (
          <select value={sessionFilter} onChange={event => setSessionFilter(event.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: '#fff', minWidth: 220 }}>
            <option value="latest">Latest completed session</option>
            {sessionOptions.map(session => <option key={session.key} value={session.key}>{session.label}</option>)}
          </select>
        )}
      </div>

      {reviewMode === 'latest' && (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Latest Results</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{latestReview.session?.label || 'No completed grading session found for these filters.'}</div>
            </div>
            <span style={S.badge('#475569', '#f1f5f9')}>{latestReview.rows.length} students</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Student</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Class</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Result</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Topic</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Date</th>
              </tr></thead>
              <tbody>
                {latestReview.rows.map(row => (
                  <tr key={row.student.id} onClick={() => setSelectedReviewStudent({ student: row.student, subject: row.score?.subject || reviewSubject })} style={{ borderBottom: '1px solid #eef2f7', cursor: 'pointer' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 700 }}>{row.student.name}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{getClassName(Number(row.student.id))}</td>
                    <td style={{ padding: '11px 14px' }}>{row.score ? renderScoreBadge(row.score) : <span style={S.badge('#9f1239', '#fee2e2')}>Blank</span>}</td>
                    <td style={{ padding: '11px 14px', color: '#334155' }}>{row.score?.skill || '—'}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{row.score?.date || latestReview.session?.date || '—'}</td>
                  </tr>
                ))}
                {latestReview.rows.length === 0 && <tr><td colSpan={5} style={{ padding: '2.2rem', textAlign: 'center', color: '#94a3b8' }}>No latest results match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviewMode === 'overall' && (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Overall Progress</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{reviewSubject ? `${reviewSubject} progress from previous valid marks. Absent/Missing entries are not counted as zero.` : 'Choose a subject to review progress.'}</div>
            </div>
            <span style={S.badge('#475569', '#f1f5f9')}>{overallRows.length} students</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Student</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Class</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Average / Level</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Strong Areas</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Weaker Areas</th>
                <th style={{ textAlign: 'right', padding: '10px 14px' }}>Assessments</th>
              </tr></thead>
              <tbody>
                {overallRows.map(row => (
                  <tr key={row.student.id} onClick={() => setSelectedReviewStudent({ student: row.student, subject: reviewSubject })} style={{ borderBottom: '1px solid #eef2f7', cursor: 'pointer' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 700 }}>{row.student.name}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{getClassName(Number(row.student.id))}</td>
                    <td style={{ padding: '11px 14px' }}><span style={{ fontWeight: 800 }}>{row.average === null ? '—' : `${row.average}%`}</span><span style={{ color: '#64748b' }}> · {row.currentLevel}</span></td>
                    <td style={{ padding: '11px 14px', color: '#166534' }}>{row.strongAreas.join(', ') || '—'}</td>
                    <td style={{ padding: '11px 14px', color: '#9a6a2a' }}>{row.weakerAreas.join(', ') || '—'}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700 }}>{row.assessmentCount}</td>
                  </tr>
                ))}
                {overallRows.length === 0 && <tr><td colSpan={6} style={{ padding: '2.2rem', textAlign: 'center', color: '#94a3b8' }}>Choose a subject to see overall progress.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviewMode === 'all' && (
      <>
      {/* Toggle latest/all scores */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <button
          onClick={() => setShowAllScores(!showAllScores)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: showAllScores ? '#0f172a' : '#f8fafc',
            color: showAllScores ? '#fff' : '#334155',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {showAllScores ? '✓ All Scores' : '◯ Latest Only'}
        </button>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing {sortedScores.length} of {allScores.length} grades</span>
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
      </>
      )}

      {selectedReviewStudent && (
        <>
          <div onClick={() => setSelectedReviewStudent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.28)', zIndex: 898 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, maxWidth: '100vw', background: '#fff', boxShadow: '-4px 0 32px rgba(15,23,42,0.14)', zIndex: 900, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '18px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedReviewStudent.student.name}</div>
                <div style={{ fontSize: 12, opacity: 0.78, marginTop: 2 }}>{selectedReviewStudent.subject} history · newest first</div>
              </div>
              <button onClick={() => setSelectedReviewStudent(null)} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gap: 8 }}>
              {reviewHistory.map(score => (
                <div key={score.id || `${score.date}-${score.skill}-${score.assessmentName}`} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#fbfdff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{score.assessmentName || score.assessmentType || 'Assessment'}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{score.date || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <div style={{ color: '#475569', fontSize: 12 }}>{score.skill || 'General'}</div>
                    {renderScoreBadge(score)}
                  </div>
                  {score.notes && <div style={{ marginTop: 7, color: '#64748b', fontSize: 12 }}>{score.notes}</div>}
                </div>
              ))}
              {reviewHistory.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '2rem 1rem' }}>No previous marks for this subject yet.</div>}
            </div>
          </div>
        </>
      )}

      {showScoreArchive && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '84vh', overflow: 'hidden', boxShadow: '0 24px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Archive/Trash</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Archived scores can be restored. Admins can permanently delete after confirmation.</div>
              </div>
              <button onClick={() => setShowScoreArchive(false)} style={{ border: 'none', background: '#f4f5f8', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 700 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', padding: 14, display: 'grid', gap: 8 }}>
              {archivedScores.map(score => (
                <div key={`${score.studentId}-${score.id}`} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{score.studentName} · {score.subject}</div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{score.date} · {score.skill || 'General'} · {score.assessmentName || score.assessmentType || 'Assessment'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button onClick={() => restoreScore(score.studentId, score.id)} style={{ ...S.btn('ghost'), padding: '6px 9px', fontSize: 11 }}>Restore</button>
                    {isLeadershipRole(role) && <button onClick={() => permanentlyDeleteScore(score.studentId, score.id)} style={{ ...S.btn('danger'), padding: '6px 9px', fontSize: 11 }}>Delete Permanently</button>}
                  </div>
                </div>
              ))}
              {archivedScores.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '2rem 1rem' }}>No archived scores.</div>}
            </div>
          </div>
        </div>
      )}

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
              onClick={archiveSelectedScore}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #fecdd3', background: '#fff1f2', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#9f1239' }}
            >
              Archive This Score
            </button>
            <button
              onClick={() => { const s = students.find(x => x.id === selectedScore.studentId); if (s) { openStudent(s, 'testScores'); setSelectedScore(null) } }}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 8 }}
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
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#12263f' }}>Bulk Grade Entry</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {classScopeLabel} · {bulkVisibleStudents.length} students · {bulkProgressCount}/{bulkVisibleStudents.length} ready
                </div>
              </div>
              <button onClick={() => setBulkHeaderCollapsed(prev => !prev)} style={{ border: '1px solid #d9e2ec', background: '#f8fafc', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#475569', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', marginRight: 6 }}>
                {bulkHeaderCollapsed ? '△ Show Form' : '▽ Collapse'}
              </button>
              <button onClick={closeBulkEntry} style={{ border: '1px solid #d9e2ec', background: '#f8fafc', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#475569', fontWeight: 700 }}>×</button>
            </div>

            <div style={{ padding: 14, borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, flexShrink: 0, maxHeight: bulkHeaderCollapsed ? 0 : '1000px', overflow: 'hidden', transition: 'max-height 0.25s ease-in-out', opacity: bulkHeaderCollapsed ? 0 : 1 }}>
              {isLeadershipRole(role) ? (
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  Teacher
                  <select value={bulkForm.teacher} onChange={e => updateBulkForm('teacher', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                    {teacherOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              ) : (
                <div style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  Teacher
                  <div style={{ padding: '9px 10px', border: '1px solid #d7dee7', borderRadius: 8, background: '#f8fafc', color: '#1e293b', fontSize: 13, fontWeight: 700 }}>
                    {loggedInTeacher}
                  </div>
                </div>
              )}

              <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                Subject
                <select value={bulkForm.subject} onChange={e => updateBulkForm('subject', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                  {bulkSubjectOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              {bulkCategoryOptions.length > 1 && (
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  Category
                  <select value={bulkForm.category} onChange={e => updateBulkForm('category', e.target.value)} style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: '#fff' }}>
                    {bulkCategoryOptions.map(option => <option key={option} value={option}>{option === 'all' ? 'All Categories' : option}</option>)}
                  </select>
                </label>
              )}

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

              {bulkForm.gradingMethod !== 'rating-scale' && (
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  Maximum Score
                  <input value={bulkForm.maxScore} onChange={e => updateBulkForm('maxScore', e.target.value)} disabled={bulkForm.gradingMethod === 'letter-grade'} placeholder="100" style={{ padding: 9, border: '1px solid #d7dee7', borderRadius: 8, background: bulkForm.gradingMethod === 'letter-grade' ? '#f8fafc' : '#fff' }} />
                </label>
              )}

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
                    ) : bulkForm.gradingMethod === 'rating-scale' ? (
                      <select value={state.score || ''} onChange={e => setStudentBulkScore(student.id, e.target.value)} disabled={!isScoreActive} style={{ width: '100%', padding: 8, border: '1px solid #d7dee7', borderRadius: 8, background: !isScoreActive ? '#f8fafc' : '#fff', fontSize: 13, fontWeight: 600 }}>
                        <option value="">Choose rating</option>
                        {SKILL_RATINGS.map(rating => <option key={rating} value={rating}>{rating}</option>)}
                      </select>
                    ) : (
                      <select value={state.score || ''} onChange={e => setStudentBulkScore(student.id, e.target.value)} disabled={!isScoreActive} style={{ width: '100%', padding: 8, border: '1px solid #d7dee7', borderRadius: 8, background: !isScoreActive ? '#f8fafc' : '#fff', fontSize: 13, fontWeight: 600 }}>
                        <option value="">Choose grade</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="F">F</option>
                      </select>
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
              <div style={{ fontSize: 12, color: bulkCompletionMessage ? '#9f1239' : '#64748b', fontWeight: bulkCompletionMessage ? 800 : 400 }}>
                {bulkCompletionMessage || 'Missed and absent entries are saved in score history with status tags.'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={closeBulkEntry} style={S.btn('ghost')} disabled={bulkSaving}>Cancel</button>
                <button onClick={saveBulkScores} style={S.btn('primary')} disabled={bulkSaving}>{bulkSaving ? 'Saving...' : 'Save Bulk Grades'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
