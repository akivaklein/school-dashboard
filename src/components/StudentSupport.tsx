import { useEffect, useState, type ComponentType, type CSSProperties, type Dispatch, type SetStateAction } from 'react'
import SupportSessions from './support/SupportSessions'
import { resolveActorName } from './dashboardData'
import { isLeadershipRole } from '../utils/permissions'
import { createStudentNote, listRecentStudentNotes, type StudentNoteRecord } from '../services/studentNotesService'
import { createStudentGoal, listStudentGoals, updateStudentGoal, type StudentGoal } from '../services/studentGoalsService'
import { createTodo, updateTodo, type Todo } from '../services/todosService'

type StudentLike = {
  id: number | string
  name?: string
  status?: string
  parentCalls?: Array<Record<string, unknown>>
  [key: string]: unknown
}

type StudentFlagLike = {
  id: string | number
  studentId?: number | string | null
  completed?: boolean
  resolvedAt?: string
  reason?: string
  priority?: string
  goal?: string
  endDate?: string
  observations?: Array<Record<string, unknown>>
  [key: string]: unknown
}

type SupportUpdate = {
  id: string
  noteId: number
  studentId: number
  goalId: string | null
  type: string
  text: string
  progress: string
  measure: string
  parentFollowUp: boolean
  author: string
  authorRole: string
  date: string
  time: string
}

type StudentSupportProps = {
  students: StudentLike[]
  setStudents: Dispatch<SetStateAction<StudentLike[]>>
  userName: string
  role: string
  alerts: Array<{ id: string | number; [key: string]: unknown }>
  openStudent: (student: StudentLike) => void
  setPage: Dispatch<SetStateAction<string>>
  flags: StudentFlagLike[]
  setFlags: Dispatch<SetStateAction<StudentFlagLike[]>>
  todos?: Todo[]
  setTodos?: Dispatch<SetStateAction<Todo[]>>
  persistStudentFields?: (id: number | string, fields: Record<string, unknown>) => Promise<boolean>
  initialSection?: string
  S: {
    btn: (variant: string) => CSSProperties
    card: CSSProperties
    tag: (color: string, bg?: string) => CSSProperties
    statCard: (color: string) => CSSProperties
    avatar: (index: number, size?: number) => CSSProperties
    [key: string]: unknown
  }
  initials: (name: string) => string
  staff: Array<{ id: string | number; name?: string; role?: string; [key: string]: unknown }>
  FlagsPanel: ComponentType<{
    students: StudentLike[]
    flags: StudentFlagLike[]
    setFlags: Dispatch<SetStateAction<StudentFlagLike[]>>
    currentStaffName: string
  }>
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function inputStyle(): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 10px',
    borderRadius: 9,
    border: '1px solid #d8dfe3',
    fontSize: 12,
    background: '#fff',
  }
}

function noteToSupportUpdate(note: StudentNoteRecord): SupportUpdate {
  const metadata = note.metadata || {}
  const created = note.created_at ? new Date(note.created_at) : new Date()

  return {
    id: `note-${note.id}`,
    noteId: note.id,
    studentId: note.student_id,
    goalId: typeof metadata.relatedGoalId === 'string' ? metadata.relatedGoalId : null,
    type: String(metadata.observationType || metadata.observationCategory || 'Observation'),
    text: note.note,
    progress: String(metadata.progress || 'Logged'),
    measure: String(metadata.measure || ''),
    parentFollowUp: metadata.followUpNeeded === true,
    author: note.author,
    authorRole: String(metadata.authorRole || 'Staff'),
    date: String(metadata.localDate || created.toISOString().slice(0, 10)),
    time: String(metadata.localTime || created.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })),
  }
}

export default function StudentSupport({
  students,
  setStudents,
  userName,
  role,
  alerts,
  openStudent,
  setPage,
  flags,
  setFlags,
  todos = [],
  setTodos,
  persistStudentFields,
  initialSection = 'overview',
  S,
  initials,
  staff,
  FlagsPanel,
}: StudentSupportProps) {
  const [section, setSection] = useState(initialSection)
  const [studentFilter, setStudentFilter] = useState('all')
  const [goals, setGoals] = useState<StudentGoal[]>([])
  const [supportUpdates, setSupportUpdates] = useState<SupportUpdate[]>([])
  const [selectedObservationId, setSelectedObservationId] = useState('')
  const [loadError, setLoadError] = useState('')

  const [goalStudentId, setGoalStudentId] = useState(students[0]?.id || '')
  const [goalTitle, setGoalTitle] = useState('')
  const [goalCategory, setGoalCategory] = useState('Behavior')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalAssignedTo, setGoalAssignedTo] = useState('')

  const [updateStudentId, setUpdateStudentId] = useState(students[0]?.id || '')
  const [updateGoalId, setUpdateGoalId] = useState('')
  const [updateType, setUpdateType] = useState('General observation')
  const [updateText, setUpdateText] = useState('')
  const [updateProgress, setUpdateProgress] = useState('Logged')
  const [updateMeasure, setUpdateMeasure] = useState('')
  const [parentFollowUp, setParentFollowUp] = useState(false)

  const [flagStudentId, setFlagStudentId] = useState(students[0]?.id || '')
  const [flagReason, setFlagReason] = useState('')
  const [flagPriority, setFlagPriority] = useState('normal')

  const [callStudentId, setCallStudentId] = useState(students[0]?.id || '')
  const [callReason, setCallReason] = useState('')
  const [callAssignedTo, setCallAssignedTo] = useState('')
  const [callOutcome, setCallOutcome] = useState('Spoke')
  const [callNote, setCallNote] = useState('')

  const [todoStudentId, setTodoStudentId] = useState('general')
  const [todoText, setTodoText] = useState('')
  const [todoDueDate, setTodoDueDate] = useState(todayIso())
  const [todoPriority, setTodoPriority] = useState('normal')

  const currentStaffName = resolveActorName(userName, role)
  const currentStaffRole = isLeadershipRole(role)
    ? 'Administration'
    : role === 'teacher' || role === 'rebbe'
      ? 'Teacher'
      : role === 'therapist' || role === 'support_staff'
        ? 'Support Staff'
        : 'Staff'

  const selectedStudentId = studentFilter === 'all' ? null : Number(studentFilter)
  const studentIdsKey = students
    .map(student => Number(student.id))
    .filter(Number.isFinite)
    .sort((left, right) => left - right)
    .join(',')
  const visibleStudents = selectedStudentId ? students.filter(student => Number(student.id) === selectedStudentId) : students
  const activeGoals = goals.filter(goal => goal.status !== 'completed')
  const visibleGoals = goals.filter(goal => !selectedStudentId || Number(goal.studentId) === selectedStudentId)
  const visibleUpdates = supportUpdates.filter(update => !selectedStudentId || update.studentId === selectedStudentId)
  const selectedObservation = supportUpdates.find(update => update.id === selectedObservationId) || null
  const updateStudentGoals = activeGoals.filter(goal => Number(goal.studentId) === Number(updateStudentId))
  const activeFlags = flags.filter(flag => !flag.completed && (!flag.endDate || flag.endDate >= todayIso()))
  const visibleFlags = activeFlags.filter(flag => !selectedStudentId || Number(flag.studentId) === selectedStudentId)
  const callsNeeded = students
    .flatMap(student => (student.parentCalls || []).map((call, index) => ({ student, call, index })))
    .filter(entry => entry.call.completed !== true && (
      entry.call.outcome === 'Call Needed' ||
      entry.call.callNeeded === true ||
      entry.call.status === 'needed'
    ))
  const visibleCallsNeeded = callsNeeded.filter(entry => !selectedStudentId || Number(entry.student.id) === selectedStudentId)
  const openTodos = todos.filter(todo => !todo.done && (!selectedStudentId || Number(todo.student_id) === selectedStudentId))
  const completedTodayTodos = todos.filter(todo => {
    const updatedDate = String(todo.updated_at || todo.date || '').slice(0, 10)
    return todo.done && updatedDate === todayIso() && (!selectedStudentId || Number(todo.student_id) === selectedStudentId)
  })

  const studentName = (studentId: number | string | null | undefined) => students.find(student => Number(student.id) === Number(studentId))?.name || 'General'
  const studentFor = (studentId: number | string | null | undefined) => students.find(student => Number(student.id) === Number(studentId))

  useEffect(() => {
    if (students.length === 0) return
    if (!goalStudentId) setGoalStudentId(students[0].id)
    if (!updateStudentId) setUpdateStudentId(students[0].id)
    if (!flagStudentId) setFlagStudentId(students[0].id)
    if (!callStudentId) setCallStudentId(students[0].id)
  }, [students, goalStudentId, updateStudentId, flagStudentId, callStudentId])

  useEffect(() => {
    let active = true

    async function loadSupportData() {
      try {
        setLoadError('')
        const scopedIds = students.map(student => Number(student.id)).filter(Number.isFinite)
        const [savedGoals, savedNotes] = await Promise.all([
          listStudentGoals(),
          listRecentStudentNotes(scopedIds),
        ])

        if (!active) return
        setGoals(savedGoals.filter(goal => scopedIds.includes(Number(goal.studentId))))
        const loadedUpdates = savedNotes.filter(note => note.metadata?.supportType === 'observation').map(noteToSupportUpdate)
        setSupportUpdates(loadedUpdates)
        setSelectedObservationId(current => current && loadedUpdates.some(update => update.id === current) ? current : '')
      } catch (error) {
        if (!active) return
        console.error('Unable to load Student Support data:', error)
        setLoadError(error instanceof Error ? error.message : 'Unable to load Student Support data.')
      }
    }

    if (students.length > 0) loadSupportData()
    return () => { active = false }
  }, [studentIdsKey])

  const sectionButton = (key: string) => ({
    padding: '9px 13px',
    borderRadius: 10,
    border: `1px solid ${section === key ? '#7893ad' : '#d8dfe3'}`,
    background: section === key ? '#e9eef2' : '#fafaf8',
    color: section === key ? '#344e67' : '#617080',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
  })

  function openObservation(update: SupportUpdate) {
    setSelectedObservationId(update.id)
    setStudentFilter(String(update.studentId))
    setUpdateStudentId(update.studentId)
    setUpdateGoalId(update.goalId || '')
    setSection('add-update')
  }

  function prepareAnotherObservation(studentId: number | string) {
    setUpdateStudentId(studentId)
    setUpdateGoalId('')
    setUpdateText('')
    setUpdateMeasure('')
    setParentFollowUp(false)
    setSelectedObservationId('')
  }

  const cardStyle: CSSProperties = {
    background: '#fafaf8',
    border: '1px solid #dfe4e7',
    borderRadius: 12,
    padding: 18,
    boxShadow: '0 4px 13px rgba(41,52,64,0.05)',
  }

  async function addGoal() {
    if (!goalStudentId || !goalTitle.trim() || !goalTarget.trim()) return

    try {
      const saved = await createStudentGoal({
        studentId: Number(goalStudentId),
        title: goalTitle,
        category: goalCategory,
        target: goalTarget,
        createdBy: currentStaffName,
        assignedTo: goalAssignedTo.trim() || currentStaffName,
      })
      setGoals(previous => [saved, ...previous])
      setGoalTitle('')
      setGoalTarget('')
      setGoalAssignedTo('')
      setStudentFilter(String(goalStudentId))
      setSection('goals')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to create goal.')
    }
  }

  async function addProgressUpdate() {
    const student = studentFor(updateStudentId)
    if (!student || !updateText.trim()) return

    const localDate = todayIso()
    const localTime = timeLabel()
    const metadata = {
      supportType: 'observation',
      observationType: updateType,
      observationCategory: updateType,
      authorRole: currentStaffRole,
      followUpNeeded: parentFollowUp,
      relatedGoalId: updateGoalId || null,
      progress: updateProgress,
      measure: updateMeasure.trim(),
      localDate,
      localTime,
    }

    try {
      const savedNote = await createStudentNote({
        studentId: Number(student.id),
        studentName: String(student.name || ''),
        note: updateText.trim(),
        author: currentStaffName,
        actorName: currentStaffName,
        metadata,
        requireMetadata: true,
      })
      const savedUpdate = noteToSupportUpdate({ ...savedNote, metadata })
      setSupportUpdates(previous => [savedUpdate, ...previous])
      setSelectedObservationId(savedUpdate.id)

      if (updateGoalId) {
        const goal = goals.find(item => item.id === updateGoalId)
        if (goal) {
          const nextGoal = {
            ...goal,
            progressNotes: [
              { id: `progress-${Date.now()}`, text: updateText.trim(), author: currentStaffName, createdAt: new Date().toISOString() },
              ...(goal.progressNotes || []),
            ],
          }
          const savedGoal = await updateStudentGoal(nextGoal)
          setGoals(previous => previous.map(item => item.id === savedGoal.id ? savedGoal : item))
        }
      }

      setUpdateText('')
      setUpdateMeasure('')
      setParentFollowUp(false)
      setStudentFilter('all')
      setSection('add-update')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save observation.')
    }
  }

  async function markGoalCompleted(goal: StudentGoal) {
    try {
      const saved = await updateStudentGoal({ ...goal, status: 'completed', completedAt: new Date().toISOString() })
      setGoals(previous => previous.map(item => item.id === saved.id ? saved : item))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to update goal.')
    }
  }

  function addSupportFlag() {
    if (!flagStudentId || !flagReason.trim()) return

    setFlags(previous => [
      {
        id: `support-flag-${Date.now()}`,
        studentId: Number(flagStudentId),
        reason: flagReason.trim(),
        goal: flagReason.trim(),
        priority: flagPriority,
        startDate: todayIso(),
        endDate: '9999-12-31',
        createdBy: currentStaffName,
        createdAt: todayIso(),
        completed: false,
        observations: [],
      },
      ...previous,
    ])
    setFlagReason('')
    setFlagPriority('normal')
    setStudentFilter(String(flagStudentId))
  }

  function resolveSupportFlag(flagId: string | number) {
    setFlags(previous => previous.map(flag => flag.id === flagId ? { ...flag, completed: true, resolvedAt: new Date().toISOString() } : flag))
  }

  async function markCallNeeded() {
    const student = studentFor(callStudentId)
    if (!student || !callReason.trim() || !persistStudentFields) return

    const nextCall = {
      id: `call-${Date.now()}`,
      date: todayIso(),
      time: timeLabel(),
      staff: currentStaffName,
      reason: callReason.trim(),
      assignedTo: callAssignedTo.trim() || '',
      outcome: 'Call Needed',
      notes: '',
      completed: false,
    }
    const nextCalls = [...(Array.isArray(student.parentCalls) ? student.parentCalls : []), nextCall]
    setStudents(previous => previous.map(entry => Number(entry.id) === Number(student.id) ? { ...entry, parentCalls: nextCalls } : entry))
    const saved = await persistStudentFields(student.id, { parentCalls: nextCalls })
    if (!saved) alert('Unable to save parent call.')
    setCallReason('')
    setCallAssignedTo('')
    setStudentFilter(String(student.id))
  }

  async function completeCall(student: StudentLike, callIndex: number) {
    if (!persistStudentFields) return
    const parentCalls = Array.isArray(student.parentCalls) ? student.parentCalls : []
    const nextCalls = parentCalls.map((call, index) => index === callIndex
      ? { ...call, outcome: callOutcome, notes: callNote.trim(), completed: true, completedAt: new Date().toISOString(), completedBy: currentStaffName }
      : call)
    setStudents(previous => previous.map(entry => Number(entry.id) === Number(student.id) ? { ...entry, parentCalls: nextCalls } : entry))
    const saved = await persistStudentFields(student.id, { parentCalls: nextCalls })
    if (!saved) alert('Unable to save parent call outcome.')
    setCallNote('')
    setCallOutcome('Spoke')
  }

  async function addTodo() {
    if (!setTodos || !todoText.trim()) return

    try {
      const saved = await createTodo({
        date: todoDueDate,
        time: '',
        text: todoText,
        category: 'support',
        studentId: todoStudentId === 'general' ? null : Number(todoStudentId),
        priority: todoPriority,
      })
      setTodos(previous => [saved, ...previous])
      setTodoText('')
      setTodoDueDate(todayIso())
      setTodoPriority('normal')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to create task.')
    }
  }

  async function markTodoDone(todo: Todo) {
    if (!setTodos) return

    try {
      const saved = await updateTodo(todo.id, { done: true })
      setTodos(previous => previous.map(item => item.id === saved.id ? saved : item))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to update task.')
    }
  }

  return (
    <div style={{ maxWidth: 1260, margin: '0 auto' }}>
      <div style={{ ...cardStyle, marginBottom: 16, padding: '21px 23px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 23, fontWeight: 900, color: '#34465a' }}>Student Support</div>
            <div style={{ fontSize: 12, color: '#778493', marginTop: 4, maxWidth: 680 }}>Student goals, observations, flags, parent calls, and follow-up tasks.</div>
          </div>
          <select value={studentFilter} onChange={event => setStudentFilter(event.target.value)} style={{ minWidth: 240, padding: '9px 11px', borderRadius: 9, border: '1px solid #d8dfe3', fontSize: 12 }}>
            <option value="all">All students</option>
            {students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 16 }}>
          <button onClick={() => setSection('overview')} style={sectionButton('overview')}>Overview</button>
          <button onClick={() => { setStudentFilter('all'); setSelectedObservationId(''); setSection('add-update') }} style={sectionButton('add-update')}>Observations ({supportUpdates.length})</button>
          <button onClick={() => setSection('flags')} style={sectionButton('flags')}>Flags ({activeFlags.length})</button>
          <button onClick={() => setSection('calls')} style={sectionButton('calls')}>Parent Calls ({callsNeeded.length})</button>
          <button onClick={() => setSection('goals')} style={sectionButton('goals')}>Goals ({activeGoals.length})</button>
          <button onClick={() => setSection('todos')} style={sectionButton('todos')}>To-Do ({openTodos.length})</button>
          <button onClick={() => setSection('sessions')} style={sectionButton('sessions')}>Support Sessions</button>
        </div>
      </div>

      {loadError && <div style={{ ...cardStyle, marginBottom: 16, color: '#9f1239' }}>{loadError}</div>}

      {section === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, alignItems: 'start' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#34465a', marginBottom: 13 }}>Recent Observations</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {visibleUpdates.slice(0, 10).map(update => (
                <button key={update.id} onClick={() => openObservation(update)} style={{ border: '1px solid #dfe4e7', background: '#f7f8f8', borderRadius: 12, padding: '12px 13px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div><div style={{ fontSize: 13, fontWeight: 900, color: '#34465a' }}>{studentName(update.studentId)}</div><div style={{ fontSize: 10.5, color: '#778493', marginTop: 3 }}>{update.type}{update.goalId ? ` - ${goals.find(goal => goal.id === update.goalId)?.title || 'Related goal'}` : ''}</div></div>
                    <div style={{ fontSize: 10.5, color: '#778493', textAlign: 'right' }}><b>{update.author}</b> - {update.authorRole}<br />{update.date} - {update.time}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#46576a', lineHeight: 1.5, marginTop: 9 }}>{update.text}</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: '#edf3ee', color: '#587261', fontSize: 10, fontWeight: 800 }}>{update.progress}</span>
                    {update.measure && <span style={{ padding: '4px 8px', borderRadius: 999, background: '#edf1f4', color: '#617080', fontSize: 10, fontWeight: 800 }}>{update.measure}</span>}
                    {update.parentFollowUp && <span style={{ padding: '4px 8px', borderRadius: 999, background: '#fff3df', color: '#8a662e', fontSize: 10, fontWeight: 800 }}>Follow-up needed</span>}
                  </div>
                </button>
              ))}
              {visibleUpdates.length === 0 && <div style={{ fontSize: 12, color: '#778493' }}>No observations yet.</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#34465a', marginBottom: 10 }}>Open Work</div>
              {[['Open flags', visibleFlags.length], ['Calls needed', visibleCallsNeeded.length], ['Tasks due', openTodos.length], ['Active goals', visibleGoals.filter(goal => goal.status === 'active').length]].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderBottom: '1px solid #e6e9eb', fontSize: 12 }}><span style={{ color: '#6f7d8c' }}>{label}</span><b style={{ color: '#34465a' }}>{value}</b></div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#34465a', marginBottom: 10 }}>Quick Actions</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <button onClick={() => setSection('add-update')} style={{ ...S.btn('primary'), width: '100%' }}>Add Observation</button>
                <button onClick={() => setSection('calls')} style={{ ...S.btn('ghost'), width: '100%' }}>Mark Call Needed</button>
                <button onClick={() => setSection('todos')} style={{ ...S.btn('ghost'), width: '100%' }}>Add Task</button>
                <button onClick={() => setPage('dashboard')} style={{ ...S.btn('ghost'), width: '100%' }}>Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {section === 'add-update' && (
        <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 16, alignItems: 'start' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#34465a', marginBottom: 5 }}>Add Observation</div>
            <div style={{ fontSize: 11, color: '#778493', marginBottom: 13 }}>Saved with structured type, author, date/time, follow-up, and related goal metadata.</div>
            <label style={{ display: 'block', fontSize: 11, color: '#6f7d8c', marginBottom: 5 }}>View</label>
            <select value={studentFilter} onChange={event => { setStudentFilter(event.target.value); setSelectedObservationId('') }} style={{ ...inputStyle(), marginBottom: 10 }}>
              <option value="all">All students</option>
              {students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
            <label style={{ display: 'block', fontSize: 11, color: '#6f7d8c', marginBottom: 5 }}>Student</label>
            <select value={updateStudentId} onChange={event => { setUpdateStudentId(event.target.value); setUpdateGoalId('') }} style={{ ...inputStyle(), marginBottom: 10 }}>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select>
            <label style={{ display: 'block', fontSize: 11, color: '#6f7d8c', marginBottom: 5 }}>Related goal</label>
            <select value={updateGoalId} onChange={event => setUpdateGoalId(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}><option value="">No related goal</option>{updateStudentGoals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select>
            <label style={{ display: 'block', fontSize: 11, color: '#6f7d8c', marginBottom: 5 }}>Category</label>
            <select value={updateType} onChange={event => setUpdateType(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}><option>General observation</option><option>Behavior</option><option>Academic</option><option>Attendance</option><option>Social</option><option>Therapy</option><option>Concern</option><option>Positive progress</option></select>
            <label style={{ display: 'block', fontSize: 11, color: '#6f7d8c', marginBottom: 5 }}>Observation</label>
            <textarea value={updateText} onChange={event => setUpdateText(event.target.value)} rows={5} style={{ ...inputStyle(), marginBottom: 10, resize: 'vertical' }} spellCheck lang="en" />
            <label style={{ display: 'block', fontSize: 11, color: '#6f7d8c', marginBottom: 5 }}>Progress / status</label>
            <select value={updateProgress} onChange={event => setUpdateProgress(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}><option>Logged</option><option>Needs support</option><option>Steady</option><option>Improving</option><option>Strong progress</option><option>Goal met</option></select>
            <label style={{ display: 'block', fontSize: 11, color: '#6f7d8c', marginBottom: 5 }}>Measurement or note tag</label>
            <input value={updateMeasure} onChange={event => setUpdateMeasure(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }} spellCheck lang="en" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#526274', marginBottom: 13 }}><input type="checkbox" checked={parentFollowUp} onChange={event => setParentFollowUp(event.target.checked)} /> Follow-up needed</label>
            <button onClick={addProgressUpdate} style={S.btn('primary')}>Save Observation</button>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 10 }}>{selectedObservation ? 'Observation Details' : 'Recent Observations'}</div>
            {selectedObservation && (
              <div style={{ border: '1px solid #dfe4e7', borderRadius: 12, padding: 12, background: '#f7f8f8', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <div><b style={{ color: '#34465a', fontSize: 13 }}>{studentName(selectedObservation.studentId)}</b><div style={{ color: '#778493', fontSize: 10.5 }}>{selectedObservation.type}</div></div>
                  <div style={{ color: '#778493', fontSize: 10.5, textAlign: 'right' }}>{selectedObservation.date}<br />{selectedObservation.time}</div>
                </div>
                <div style={{ color: '#526274', fontSize: 12, lineHeight: 1.5 }}>{selectedObservation.text}</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 999, background: '#edf3ee', color: '#587261', fontSize: 10, fontWeight: 800 }}>{selectedObservation.progress}</span>
                  {selectedObservation.measure && <span style={{ padding: '4px 8px', borderRadius: 999, background: '#edf1f4', color: '#617080', fontSize: 10, fontWeight: 800 }}>{selectedObservation.measure}</span>}
                  {selectedObservation.parentFollowUp && <span style={{ padding: '4px 8px', borderRadius: 999, background: '#fff3df', color: '#8a662e', fontSize: 10, fontWeight: 800 }}>Follow-up needed</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => prepareAnotherObservation(selectedObservation.studentId)} style={S.btn('primary')}>Add Another for {studentName(selectedObservation.studentId)}</button>
                  <button onClick={() => { const student = studentFor(selectedObservation.studentId); if (student) openStudent(student) }} style={S.btn('ghost')}>Open Student</button>
                </div>
              </div>
            )}
            {visibleUpdates.slice(0, 12).map(update => <button key={update.id} onClick={() => openObservation(update)} style={{ width: '100%', textAlign: 'left', background: selectedObservationId === update.id ? '#eef3f7' : 'transparent', border: 'none', borderBottom: '1px solid #e6e9eb', padding: '10px 0', cursor: 'pointer' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10.5 }}><b style={{ color: '#46576a' }}>{studentName(update.studentId)} - {update.type}</b><span style={{ color: '#778493' }}>{update.date} - {update.time}</span></div><div style={{ fontSize: 11.5, color: '#526274', lineHeight: 1.45, marginTop: 5 }}>{update.text}</div></button>)}
            {visibleUpdates.length === 0 && <div style={{ color: '#778493', fontSize: 12 }}>No observations yet.</div>}
          </div>
        </div>
      )}

      {section === 'flags' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 16, alignItems: 'start' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Flag Student</div>
              <select value={flagStudentId} onChange={event => setFlagStudentId(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select>
              <input value={flagReason} onChange={event => setFlagReason(event.target.value)} placeholder="Short reason" style={{ ...inputStyle(), marginBottom: 10 }} spellCheck lang="en" />
              <select value={flagPriority} onChange={event => setFlagPriority(event.target.value)} style={{ ...inputStyle(), marginBottom: 12 }}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
              <button onClick={addSupportFlag} style={S.btn('primary')}>Create Flag</button>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Open Flags</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {visibleFlags.map(flag => <div key={flag.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', border: '1px solid #e1e6ea', borderRadius: 10, padding: 10 }}><div><b style={{ color: '#34465a', fontSize: 12 }}>{studentName(flag.studentId)}</b><div style={{ color: '#526274', fontSize: 12 }}>{flag.reason || flag.goal}</div><div style={{ color: '#778493', fontSize: 10 }}>{flag.priority || 'normal'} priority</div></div><button onClick={() => resolveSupportFlag(flag.id)} style={S.btn('ghost')}>Resolve</button></div>)}
                {visibleFlags.length === 0 && <div style={{ color: '#778493', fontSize: 12 }}>No open flags.</div>}
              </div>
            </div>
          </div>
          <FlagsPanel students={students} flags={flags} setFlags={setFlags} currentStaffName={currentStaffName} />
        </div>
      )}

      {section === 'calls' && (
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 16, alignItems: 'start' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Mark Call Needed</div>
            <select value={callStudentId} onChange={event => setCallStudentId(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select>
            <input value={callReason} onChange={event => setCallReason(event.target.value)} placeholder="Reason" style={{ ...inputStyle(), marginBottom: 10 }} spellCheck lang="en" />
            <select value={callAssignedTo} onChange={event => setCallAssignedTo(event.target.value)} style={{ ...inputStyle(), marginBottom: 12 }}><option value="">Assign later</option>{staff.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}</select>
            <button onClick={markCallNeeded} style={S.btn('primary')}>Mark Call Needed</button>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Open Parent Calls</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {visibleCallsNeeded.map(({ student, call, index }) => <div key={`${student.id}-${index}`} style={{ border: '1px solid #e1e6ea', borderRadius: 10, padding: 11, background: '#fff' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><b style={{ color: '#34465a', fontSize: 13 }}>{student.name}</b><span style={{ color: '#778493', fontSize: 11 }}>{String(call.date || '')} {String(call.time || '')}</span></div><div style={{ color: '#526274', fontSize: 12, marginTop: 5 }}>{String(call.reason || call.notes || 'Call needed')}</div>{call.assignedTo && <div style={{ color: '#778493', fontSize: 11, marginTop: 4 }}>Assigned to {String(call.assignedTo)}</div>}<div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: 8, marginTop: 10 }}><select value={callOutcome} onChange={event => setCallOutcome(event.target.value)} style={inputStyle()}><option>Spoke</option><option>No Answer</option><option>Left Message</option></select><input value={callNote} onChange={event => setCallNote(event.target.value)} placeholder="Short note" style={inputStyle()} spellCheck lang="en" /><button onClick={() => completeCall(student, index)} style={S.btn('success')}>Complete</button></div></div>)}
              {visibleCallsNeeded.length === 0 && <div style={{ color: '#778493', fontSize: 12 }}>No open parent calls.</div>}
            </div>
          </div>
        </div>
      )}

      {section === 'goals' && (
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 16, alignItems: 'start' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Create Goal</div>
            <select value={goalStudentId} onChange={event => setGoalStudentId(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select>
            <input value={goalTitle} onChange={event => setGoalTitle(event.target.value)} placeholder="Goal title" style={{ ...inputStyle(), marginBottom: 10 }} spellCheck lang="en" />
            <select value={goalCategory} onChange={event => setGoalCategory(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}><option>Behavior</option><option>Academic</option><option>Attendance</option><option>Social</option><option>Classroom Participation</option><option>Independence</option></select>
            <textarea value={goalTarget} onChange={event => setGoalTarget(event.target.value)} placeholder="Target" rows={3} style={{ ...inputStyle(), marginBottom: 10, resize: 'vertical' }} spellCheck lang="en" />
            <select value={goalAssignedTo} onChange={event => setGoalAssignedTo(event.target.value)} style={{ ...inputStyle(), marginBottom: 12 }}><option value="">Assign to me</option>{staff.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}</select>
            <button onClick={addGoal} style={S.btn('primary')}>Create Goal</button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {visibleGoals.map(goal => <div key={goal.id} style={cardStyle}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div><b style={{ color: '#34465a', fontSize: 14 }}>{studentName(goal.studentId)}</b><div style={{ color: '#46576a', fontSize: 13, fontWeight: 800, marginTop: 3 }}>{goal.title}</div></div><span style={{ color: goal.status === 'completed' ? '#64748b' : '#587261', fontSize: 11, fontWeight: 900 }}>{goal.status}</span></div><div style={{ color: '#526274', fontSize: 12, lineHeight: 1.45, marginTop: 10 }}>{goal.target}</div><div style={{ color: '#778493', fontSize: 10.5, marginTop: 8 }}>Created by {goal.createdBy || 'Staff'} - Assigned to {goal.assignedTo || 'Staff'}</div>{goal.progressNotes.slice(0, 3).map(note => <div key={note.id} style={{ marginTop: 8, padding: 8, background: '#f3f5f6', borderRadius: 8, fontSize: 11.5, color: '#526274' }}>{note.text}</div>)}{goal.status !== 'completed' && <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button onClick={() => { setUpdateStudentId(goal.studentId); setUpdateGoalId(goal.id); setSection('add-update') }} style={S.btn('primary')}>Add Progress</button><button onClick={() => markGoalCompleted(goal)} style={S.btn('success')}>Complete</button></div>}</div>)}
            {visibleGoals.length === 0 && <div style={cardStyle}>No goals yet.</div>}
          </div>
        </div>
      )}

      {section === 'todos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 16, alignItems: 'start' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Add To-Do</div>
            <select value={todoStudentId} onChange={event => setTodoStudentId(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}><option value="general">General task</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select>
            <input value={todoText} onChange={event => setTodoText(event.target.value)} placeholder="Task" style={{ ...inputStyle(), marginBottom: 10 }} spellCheck lang="en" />
            <input type="date" value={todoDueDate} onChange={event => setTodoDueDate(event.target.value)} style={{ ...inputStyle(), marginBottom: 10 }} />
            <select value={todoPriority} onChange={event => setTodoPriority(event.target.value)} style={{ ...inputStyle(), marginBottom: 12 }}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            <button onClick={addTodo} style={S.btn('primary')}>Add Task</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Open Tasks</div>
              {openTodos.map(todo => <div key={todo.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #e6e9eb' }}><input type="checkbox" checked={todo.done} onChange={() => markTodoDone(todo)} /><div><b style={{ color: '#34465a', fontSize: 12 }}>{todo.text}</b><div style={{ color: '#778493', fontSize: 10.5 }}>{studentName(todo.student_id)} - due {todo.date} - {todo.priority || 'normal'}</div></div></div>)}
              {openTodos.length === 0 && <div style={{ color: '#778493', fontSize: 12 }}>No open tasks.</div>}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Completed Today</div>
              {completedTodayTodos.map(todo => <div key={todo.id} style={{ color: '#526274', fontSize: 12, padding: '6px 0' }}>{todo.text} <span style={{ color: '#778493' }}>({studentName(todo.student_id)})</span></div>)}
              {completedTodayTodos.length === 0 && <div style={{ color: '#778493', fontSize: 12 }}>Nothing completed today yet.</div>}
            </div>
          </div>
        </div>
      )}

      {section === 'sessions' && <SupportSessions students={students} setStudents={setStudents} staff={staff} />}
    </div>
  )
}
