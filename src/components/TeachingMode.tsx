import { useEffect, useMemo, useRef, useState } from 'react'
import playSound from '../utils/playSound'
import { resolveActorName } from './dashboardData'

const TEACHING_MODE_SCOPE_STATE_STORAGE_KEY = 'schoolDashboardTeachingModeScopeV1'

function readTeachingModeScopeState(): { scopeType?: string; scopeValue?: string } {
  try {
    const raw = localStorage.getItem(TEACHING_MODE_SCOPE_STATE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return {
      scopeType: typeof parsed.scopeType === 'string' ? parsed.scopeType : undefined,
      scopeValue: typeof parsed.scopeValue === 'string' ? parsed.scopeValue : undefined,
    }
  } catch {
    return {}
  }
}

const BEHAVIORS_POSITIVE = [
  { id: 'p1', label: 'Appropriate appearance', points: 1 },
  { id: 'p2', label: 'On-time to class', points: 2 },
  { id: 'p3', label: 'Ignored peer misbehavior', points: 2 },
  { id: 'p4', label: 'Major appropriate behavior', points: 3 },
  { id: 'p5', label: 'Completed homework', points: 2 },
  { id: 'p6', label: 'Helped a classmate', points: 2 },
]

const BEHAVIORS_NEGATIVE = [
  { id: 'n1', label: 'Speaking without permission', points: -1 },
  { id: 'n2', label: 'Off-task behavior', points: -1 },
  { id: 'n3', label: 'Noncompliance', points: -1 },
  { id: 'n4', label: 'Disruptive behavior', points: -1 },
  { id: 'n5', label: 'Disrespect', points: -2 },
  { id: 'n6', label: 'Physical aggression', points: -3 },
]

export default function TeachingMode({
  students,
  allStudents = [],
  setStudents,
  onExit,
  isAdmin,
  role = 'teacher',
  userName,
  initialClass = null,
  S,
  STAFF,
  STUDENT_CLASSES,
  CLASSES,
  statusColor,
  statusEmoji,
  statusLabel,
  isVIP,
  initials,
  persistStudentFields,
  persistStudentFieldsBulk,
  recordStudentPointsAction,
  canViewEntireSchool = false,
  assignedStudentIds = [],
  assignmentPeriods = {},
  teachingAssignments = {},
}) {

  const isStudentInClass = student =>
    student.status === 'present' &&
    !['absent', 'left-early'].includes(student.dailyStatus)


  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [showTeachingActions, setShowTeachingActions] = useState(false)
  const [actionStudentSearch, setActionStudentSearch] = useState('')
  const [quickActionStudent, setQuickActionStudent] = useState(null)
  const [showBulkActionPanel, setShowBulkActionPanel] = useState(false)
  const [leavePopup, setLeavePopup] = useState(null)
  const [leaveReason, setLeaveReason] = useState('therapy')
  const [leaveStaffSearch, setLeaveStaffSearch] = useState('')
  const [leaveStaffId, setLeaveStaffId] = useState('')
  const [selectedClass, setSelectedClass] = useState(initialClass)
  const [scopeType, setScopeType] = useState(canViewEntireSchool ? 'entire' : 'assigned')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [lateClassPopup, setLateClassPopup] = useState(null) // studentId
  const [lateClassStaffSearch, setLateClassStaffSearch] = useState('')
  const [lateClassStaffId, setLateClassStaffId] = useState('')
  const [lateClassNote, setLateClassNote] = useState('')
  const actingStaffName = resolveActorName(userName, isAdmin ? 'admin' : 'teacher')

  const isTeacherRole = role === 'teacher' || role === 'rebbe'

  const roleStudents = useMemo(() => {
    const base = Array.isArray(students) ? students : []
    const seen = new Set()
    return base.filter(student => {
      const key = Number(student.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [students])

  const schoolStudents = useMemo(() => {
    const base = Array.isArray(allStudents) && allStudents.length > 0
      ? allStudents
      : roleStudents
    const seen = new Set()
    return base.filter(student => {
      const key = Number(student.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [allStudents, roleStudents])

  const scopeBaseStudents = canViewEntireSchool ? schoolStudents : roleStudents
  const scopeBaseIdSet = useMemo(
    () => new Set(scopeBaseStudents.map(student => Number(student.id))),
    [scopeBaseStudents],
  )

  const assignedIdSet = useMemo(
    () => new Set((assignedStudentIds || []).map(id => Number(id)).filter(Number.isFinite)),
    [assignedStudentIds],
  )

  const assignedStudents = useMemo(
    () => scopeBaseStudents.filter(student => assignedIdSet.has(Number(student.id))),
    [scopeBaseStudents, assignedIdSet],
  )

  const hasAssignedStudents = assignedStudents.length > 0

  const classOptions = useMemo(() => {
    const classIdsInScope = new Set(
      scopeBaseStudents
        .map(student => STUDENT_CLASSES[student.id])
        .filter(Boolean),
    )

    return CLASSES.filter(cls => classIdsInScope.has(cls.id))
  }, [scopeBaseStudents, STUDENT_CLASSES, CLASSES])

  const teacherOptions = useMemo(
    () => classOptions.map(cls => cls.teacher).filter((value, index, arr) => arr.indexOf(value) === index),
    [classOptions],
  )

  const gradeOptions = useMemo(
    () => classOptions.map(cls => cls.grade).filter((value, index, arr) => arr.indexOf(value) === index),
    [classOptions],
  )

  const periodIds = [1, 2, 3]
  const periodBuckets = useMemo(() => {
    const ownerAssignments = canViewEntireSchool
      ? Object.values(teachingAssignments || {})
      : [{ periods: assignmentPeriods || {} }]

    return periodIds.map(period => {
      const idSet = new Set()

      ownerAssignments.forEach(assignment => {
        const ids = assignment?.periods?.[period] || []
        ids.forEach(id => {
          const numericId = Number(id)
          if (!Number.isFinite(numericId)) return
          if (!scopeBaseIdSet.has(numericId)) return
          idSet.add(numericId)
        })
      })

      return {
        period,
        ids: Array.from(idSet),
      }
    })
  }, [canViewEntireSchool, teachingAssignments, assignmentPeriods, scopeBaseIdSet])

  const periodOptions = periodBuckets.filter(bucket => bucket.ids.length > 0).map(bucket => String(bucket.period))
  const selectorInitializedRef = useRef(false)
  const allowedScopeValues = useMemo(() => {
    const values = ['teacher', 'class', 'grade', 'period']
    if (canViewEntireSchool) values.unshift('entire')
    if (hasAssignedStudents) values.push('assigned')
    return values
  }, [canViewEntireSchool, hasAssignedStudents])

  useEffect(() => {
    const defaultClass = initialClass && classOptions.some(cls => cls.id === initialClass)
      ? initialClass
      : classOptions[0]?.id || null
    const defaultPeriod = periodOptions[0] || ''
    const defaultScopeType = canViewEntireSchool
      ? 'entire'
      : isTeacherRole
        ? defaultPeriod
          ? 'period'
          : defaultClass
            ? 'class'
            : hasAssignedStudents
              ? 'assigned'
              : 'class'
        : hasAssignedStudents
          ? 'assigned'
          : 'class'
    const storedScopeState = readTeachingModeScopeState()
    const restoredScopeType = storedScopeState.scopeType
    const restoredScopeValue = storedScopeState.scopeValue || ''
    const hasValidRestoredScope = Boolean(restoredScopeType && allowedScopeValues.includes(restoredScopeType))

    if (!selectorInitializedRef.current) {
      selectorInitializedRef.current = true

      setScopeType(hasValidRestoredScope ? restoredScopeType : defaultScopeType)
    }

    setSelectedClass(prev => {
      if (prev && classOptions.some(cls => cls.id === prev)) return prev
      if (hasValidRestoredScope && restoredScopeType === 'class' && restoredScopeValue && classOptions.some(cls => cls.id === restoredScopeValue)) {
        return restoredScopeValue
      }
      return defaultClass
    })
    setSelectedTeacher(prev => {
      if (prev && teacherOptions.includes(prev)) return prev
      if (hasValidRestoredScope && restoredScopeType === 'teacher' && restoredScopeValue && teacherOptions.includes(restoredScopeValue)) {
        return restoredScopeValue
      }
      return teacherOptions[0] || ''
    })
    setSelectedGrade(prev => {
      if (prev && gradeOptions.includes(prev)) return prev
      if (hasValidRestoredScope && restoredScopeType === 'grade' && restoredScopeValue && gradeOptions.includes(restoredScopeValue)) {
        return restoredScopeValue
      }
      return gradeOptions[0] || ''
    })
    setSelectedPeriod(prev => {
      if (prev && periodOptions.includes(prev)) return prev
      if (hasValidRestoredScope && restoredScopeType === 'period' && restoredScopeValue && periodOptions.includes(restoredScopeValue)) {
        return restoredScopeValue
      }
      return defaultPeriod
    })
  }, [
    canViewEntireSchool,
    isTeacherRole,
    hasAssignedStudents,
    allowedScopeValues,
    initialClass,
    classOptions,
    teacherOptions,
    gradeOptions,
    periodOptions,
  ])

  useEffect(() => {
    if (allowedScopeValues.includes(scopeType)) return

    if (canViewEntireSchool) {
      setScopeType('entire')
      return
    }

    if (hasAssignedStudents) {
      setScopeType('assigned')
      return
    }

    setScopeType('class')
  }, [scopeType, allowedScopeValues, canViewEntireSchool, hasAssignedStudents])

  useEffect(() => {
    const selectedScopeValue =
      scopeType === 'class'
        ? (selectedClass || '')
        : scopeType === 'teacher'
          ? selectedTeacher
          : scopeType === 'grade'
            ? selectedGrade
            : scopeType === 'period'
              ? selectedPeriod
              : ''

    try {
      localStorage.setItem(
        TEACHING_MODE_SCOPE_STATE_STORAGE_KEY,
        JSON.stringify({
          scopeType,
          scopeValue: selectedScopeValue,
        }),
      )
    } catch (error) {
      console.error('Failed to persist teaching mode scope state:', error)
    }
  }, [scopeType, selectedClass, selectedTeacher, selectedGrade, selectedPeriod])

  function buildClassLogEntry(type, note, extra = {}) {
    return {
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      type,
      note,
      staffId: extra.staffId || null,
      staffName: actingStaffName,
      recordedAt: new Date().toISOString(),
    }
  }

  // Session + intervals
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [intervalNum, setIntervalNum] = useState(1)
  const [intervalSeconds, setIntervalSeconds] = useState(0)
  const INTERVAL_DURATION = 20 * 60 // 20 minutes
  const [intervalHistory, setIntervalHistory] = useState([])
  const [intervalReminders, setIntervalReminders] = useState({}) // {studentId: reminders this interval}
  const [showSummary, setShowSummary] = useState(false)

  // Timer
  useEffect(() => {
    if (!sessionActive) return
    const t = setInterval(() => {
      setIntervalSeconds(prev => {
        if (prev + 1 >= INTERVAL_DURATION) {
          // Auto chime - move to next interval
          playSound('store')
          nextInterval()
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [sessionActive, intervalNum])

  function startSession() {
    setSessionActive(true)
    setSessionStartTime(new Date())
    setIntervalNum(1)
    setIntervalSeconds(0)
    setIntervalReminders({})
    setIntervalHistory([])
  }

  function nextInterval() {
    playSound('store')
    // Save this interval's data
    setIntervalHistory(prev => [...prev, {
      interval: intervalNum,
      reminders: { ...intervalReminders },
      duration: intervalSeconds
    }])
    setIntervalNum(prev => prev + 1)
    setIntervalSeconds(0)
    setIntervalReminders({}) // Fresh start - reminders reset
  }

  function endSession() {
    // Save last interval
    setIntervalHistory(prev => [...prev, {
      interval: intervalNum,
      reminders: { ...intervalReminders },
      duration: intervalSeconds
    }])
    setSessionActive(false)
    setShowSummary(true)
  }

  function addIntervalReminder(studentId) {
    playSound('negative')
    setIntervalReminders(prev => ({ ...prev, [studentId]: (prev[studentId] || 0) + 1 }))
    recordStudentPointsAction({
      studentId,
      pointsDelta: 0,
      reminderDelta: 1,
      reason: `Reminder (Interval ${intervalNum})`,
      eventType: 'reminder',
      category: 'teaching',
      sourceContext: 'teaching-mode-interval',
      metadata: {
        interval: intervalNum,
      },
    })
  }

  const filteredStaff = leaveStaffSearch.length > 0
    ? STAFF.filter(st => st.name.toLowerCase().includes(leaveStaffSearch.toLowerCase()) || (st.role || '').toLowerCase().includes(leaveStaffSearch.toLowerCase()))
    : STAFF

  const scopeOptions = [
    ...(canViewEntireSchool ? [{ value: 'entire', label: 'Entire School' }] : []),
    { value: 'teacher', label: 'Teacher' },
    { value: 'class', label: 'Class' },
    { value: 'grade', label: 'Grade' },
    { value: 'period', label: 'Period' },
    ...(hasAssignedStudents ? [{ value: 'assigned', label: 'My Assigned Students' }] : []),
  ]

  const scopedStudents = useMemo(() => {
    const byClass = (student, classId) => STUDENT_CLASSES[student.id] === classId
    const byTeacher = (student, teacherName) => {
      const classId = STUDENT_CLASSES[student.id]
      const cls = CLASSES.find(item => item.id === classId)
      return cls?.teacher === teacherName
    }
    const byGrade = (student, gradeName) => {
      const classId = STUDENT_CLASSES[student.id]
      const cls = CLASSES.find(item => item.id === classId)
      return cls?.grade === gradeName
    }

    if (scopeType === 'entire') {
      return canViewEntireSchool ? schoolStudents : scopeBaseStudents
    }

    if (scopeType === 'assigned') {
      return hasAssignedStudents ? assignedStudents : scopeBaseStudents
    }

    if (scopeType === 'class') {
      if (!selectedClass) return scopeBaseStudents
      return scopeBaseStudents.filter(student => byClass(student, selectedClass))
    }

    if (scopeType === 'teacher') {
      if (!selectedTeacher) return scopeBaseStudents
      return scopeBaseStudents.filter(student => byTeacher(student, selectedTeacher))
    }

    if (scopeType === 'grade') {
      if (!selectedGrade) return scopeBaseStudents
      return scopeBaseStudents.filter(student => byGrade(student, selectedGrade))
    }

    if (scopeType === 'period') {
      const bucket = periodBuckets.find(item => String(item.period) === String(selectedPeriod))
      if (!bucket) return []
      const periodSet = new Set(bucket.ids)
      return scopeBaseStudents.filter(student => periodSet.has(Number(student.id)))
    }

    return scopeBaseStudents
  }, [
    scopeType,
    canViewEntireSchool,
    schoolStudents,
    scopeBaseStudents,
    hasAssignedStudents,
    assignedStudents,
    selectedClass,
    selectedTeacher,
    selectedGrade,
    selectedPeriod,
    periodBuckets,
    STUDENT_CLASSES,
    CLASSES,
  ])

  const classStudents = scopedStudents
  const filtered = classStudents.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  function closeTeachingActions() {
    setSelected([])
    setActionStudentSearch('')
    setShowTeachingActions(false)
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const updated = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]

      setShowTeachingActions(updated.length > 0)

      if (updated.length === 0) {
        setActionStudentSearch('')
      }

      return updated
    })
  }

  function applyToSelected(amount, label) {
    if (selected.length === 0) return

    playSound(amount > 0 ? 'positive' : 'negative')

    Promise.all(
      selected.map(studentId =>
        recordStudentPointsAction({
          studentId,
          pointsDelta: amount,
          reminderDelta: amount < 0 ? 1 : 0,
          reason: label,
          eventType: amount > 0 ? 'award' : 'deduction',
          category: 'teaching',
          sourceContext: 'teaching-mode-bulk-action',
          metadata: {
            bulkSelectionSize: selected.length,
          },
        })
      )
    )

    // Keep the popup and current students selected so several
    // behaviors can be recorded in one classroom interaction.
  }

  async function handleToggle(s) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    if (isStudentInClass(s)) {
      setLeavePopup(s.id)
      setLeaveReason('therapy')
      setLeaveStaffSearch('')
      setLeaveStaffId('')
      return
    }

    const original = s
    const wasNotInSchool =
      s.dailyStatus === 'absent' ||
      s.status === 'absent' ||
      s.status === 'not-arrived'

    const updatedClassLog = [
      ...(s.classLog || []),
      buildClassLogEntry(
        'in',
        wasNotInSchool
          ? `Arrived late to yeshiva (marked by ${actingStaffName})`
          : `Returned to class (marked by ${actingStaffName})`
      )
    ]

    const fields = wasNotInSchool
      ? { status: 'present', dailyStatus: 'late', withStaff: null, classLog: updatedClassLog }
      : { status: 'present', withStaff: null, classLog: updatedClassLog }

    setStudents(prev =>
      prev.map(x => {
        if (Number(x.id) !== Number(s.id)) return x

        return {
          ...x,
          ...fields,
          withStaff: null,
          lateDetails: wasNotInSchool
            ? {
                timeArrived: timeStr,
                reason: 'arrived-late',
                note: 'Marked present from School-Wide Mode',
                markedBy: actingStaffName,
                markedAt: new Date().toISOString(),
              }
            : x.lateDetails
        }
      })
    )

    const fieldsWithAudit = wasNotInSchool
      ? {
          ...fields,
          lateDetails: {
            timeArrived: timeStr,
            reason: 'arrived-late',
            note: 'Marked present from School-Wide Mode',
            markedBy: actingStaffName,
            markedAt: new Date().toISOString(),
          },
        }
      : fields

    const success = await persistStudentFields(s.id, fieldsWithAudit)

    if (!success) {
      setStudents(prev =>
        prev.map(x =>
          Number(x.id) === Number(s.id) ? original : x
        )
      )
      alert('Unable to save student status to Supabase.')
    }
  }

  async function confirmLeave() {
    const studentId = leavePopup
    if (!studentId) return

    const original = students.find(
      x => Number(x.id) === Number(studentId)
    )

    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    const staffObj = leaveStaffId
      ? STAFF.find(st => st.id === leaveStaffId)
      : null

    const effectiveReason =
      staffObj?.role === 'BT'
        ? 'with-bt'
        : leaveReason

    const statusMap = {
      therapy: 'therapy',
      'with-bt': 'with-bt',
      menahel: 'present',
      unknown: 'unknown',
      other: 'unknown'
    }

    const newStatus = statusMap[effectiveReason] || 'unknown'

    const note = staffObj
      ? `Left with ${staffObj.name} (${staffObj.role})`
      : effectiveReason === 'unknown'
        ? 'Location unknown'
        : effectiveReason === 'with-bt'
          ? 'Left with BT'
          : effectiveReason === 'therapy'
            ? 'Left for therapy'
            : 'Left class'

    setStudents(prev => {
      const updated = prev.map(x =>
        Number(x.id) === Number(studentId)
          ? {
              ...x,
              status: newStatus,
              withStaff: leaveStaffId || null,
              classLog: [
                ...(x.classLog || []),
                buildClassLogEntry(
                  'out',
                  `${note} (recorded by ${actingStaffName})`,
                  { staffId: leaveStaffId || null }
                )
              ]
            }
          : x
      )
      setLeavePopup(null)
      
      // Get the updated student to get the new classLog
      const updatedStudent = updated.find(x => Number(x.id) === Number(studentId))
      if (updatedStudent) {
        persistStudentFields(studentId, {
          status: newStatus,
          withStaff: leaveStaffId || null,
          classLog: updatedStudent.classLog
        }).catch(error => {
          console.error('Unable to save student status to Supabase:', error)
          alert('Unable to save student status to Supabase.')
        })
      }
      
      return updated
    })
  }

  const mins = Math.floor(intervalSeconds / 60)
  const secs = intervalSeconds % 60
  const progress = (intervalSeconds / INTERVAL_DURATION) * 100

  // Summary screen
  if (showSummary) {
    return (
      <div style={{
      position: 'fixed',
      inset: 0,
      background: '#f4f6f9',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      color: '#17243a'
    }}>
        <div style={{ background: '#0f172a', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>📊 Session Summary</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowSummary(false); setSessionActive(false); setIntervalNum(1); setIntervalSeconds(0); setIntervalHistory([]); setIntervalReminders({}) }} style={S.btn('ghost')}>🔄 New Session</button>
            <button onClick={onExit} style={S.btn('danger')}>← Back to School Day</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${intervalHistory.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
              {intervalHistory.map((iv, i) => (
                <div key={i} style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#111827' }}>Interval {iv.interval}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{Math.floor(iv.duration/60)} min {iv.duration%60} sec</div>
                  {Object.keys(iv.reminders).length === 0 
                    ? <div style={{ fontSize: 12, color: '#56765f', fontWeight: 600 }}>✅ No reminders!</div>
                    : Object.entries(iv.reminders).map(([id, count]) => {
                        const s = students.find(x => x.id === parseInt(id))
                        return <div key={id} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f8fafc' }}><span style={{ fontWeight: 600 }}>{s?.name}</span>: <span style={{ color: '#8f3a50', fontWeight: 700 }}>{count} ⚠️</span></div>
                      })
                  }
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🏆 Student Performance Across Intervals</div>
              {filtered.map((s, i) => {
                const totalReminders = intervalHistory.reduce((acc, iv) => acc + (iv.reminders[s.id] || 0), 0)
                const cleanIntervals = intervalHistory.filter(iv => !iv.reminders[s.id]).length
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={S.avatar(i, 30)}>{initials(s.name)}</div>
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {intervalHistory.map((iv, j) => (
                        <div key={j} style={{ width: 28, height: 28, borderRadius: 6, background: iv.reminders[s.id] ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: iv.reminders[s.id] ? '#9f1239' : '#56765f' }}>
                          {iv.reminders[s.id] ? iv.reminders[s.id] : '✓'}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: totalReminders === 0 ? '#56765f' : '#9f1239', fontWeight: 700 }}>
                      {totalReminders === 0 ? '⭐ Perfect' : `${totalReminders} total`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f8fafc', zIndex: 200, display: 'flex', flexDirection: 'column' }}>

      {/* Late to Class Popup */}
      {lateClassPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 400, boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#9a6a2a', padding: '14px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>⏰ {students.find(s=>s.id===lateClassPopup)?.name} — Late to Class</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Why was he late to this class?</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Was with staff member?</div>
              <input value={lateClassStaffSearch} onChange={e => { setLateClassStaffSearch(e.target.value); setLateClassStaffId('') }} placeholder="Start typing name (Rabbi Ehrnreich, Rabbi Baum...)" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 6 }} />
              {lateClassStaffSearch.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                  {[...STAFF]
                    .filter((st, i, arr) => arr.findIndex(x => x.id === st.id) === i)
                    .filter(st => st.name.toLowerCase().includes(lateClassStaffSearch.toLowerCase()) || (st.role || '').toLowerCase().includes(lateClassStaffSearch.toLowerCase()))
                    .slice(0, 8)
                    .map(st => (
                      <div key={st.id} onClick={() => { setLateClassStaffId(st.id); setLateClassStaffSearch(st.name) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: lateClassStaffId === st.id ? '#f8fafc' : '#fff', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{st.name}</span>
                        <span style={{ color: '#64748b', fontSize: 11 }}>{st.role}</span>
                      </div>
                    ))}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Note (optional)</div>
              <input value={lateClassNote} onChange={e => setLateClassNote(e.target.value)} placeholder="e.g. was asked to come speak with Menahel" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLateClassPopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={async () => {
                  const studentId = lateClassPopup
                  if (!studentId) return
                  const original = students.find(x => x.id === studentId)
                  const staffObj = lateClassStaffId ? STAFF.find(st => st.id === lateClassStaffId) : null
                  const note = staffObj ? `Came late — was with ${staffObj.name}${lateClassNote ? `: ${lateClassNote}` : ''}` : lateClassNote ? `Came late — ${lateClassNote}` : 'Came late to class'
                  const classLogEntry = buildClassLogEntry(
                    'in',
                    `${note} (recorded by ${actingStaffName})`,
                    { staffId: lateClassStaffId || null }
                  )
                  const lateDetails = {
                    timeArrived: new Date().toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    }),
                    reason: 'late-to-class',
                    note,
                    markedBy: actingStaffName,
                    markedAt: new Date().toISOString(),
                  }

                  setStudents(prev => prev.map(x => x.id === studentId ? {
                    ...x, status: 'present',
                    classLog: [...(x.classLog||[]), classLogEntry],
                    lateDetails,
                  } : x))
                  setLateClassPopup(null); setLateClassStaffSearch(''); setLateClassStaffId(''); setLateClassNote('')

                  const success = await persistStudentFields(studentId, {
                    status: 'present',
                    withStaff: null,
                    lateDetails,
                    classLog: [...(original?.classLog || []), classLogEntry],
                  })
                  if (!success && original) {
                    setStudents(prev => prev.map(x => x.id === studentId ? original : x))
                    alert('Unable to save student status to Supabase.')
                  }
                }} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave popup */}
      {leavePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 400, boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '14px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>🚪 {students.find(s=>s.id===leavePopup)?.name} is leaving class</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Reason</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {[['therapy','🧠 Therapy'],['with-bt','👤 With BT'],['menahel','🎓 Called to Menahel'],['unknown','❓ Location Unknown'],['other','📝 Other']].map(([val, label]) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: `2px solid ${leaveReason === val ? '#0f172a' : '#e5e7eb'}`, cursor: 'pointer', background: leaveReason === val ? '#f8fafc' : '#fff' }}>
                    <input type="radio" name="reason" value={val} checked={leaveReason === val} onChange={() => setLeaveReason(val)} />
                    <span style={{ fontWeight: leaveReason === val ? 700 : 400, fontSize: 13 }}>{label}</span>
                  </label>
                ))}
              </div>
              {(leaveReason === 'therapy' || leaveReason === 'with-bt') && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>With whom?</div>
                  <input value={leaveStaffSearch} onChange={e => { setLeaveStaffSearch(e.target.value); setLeaveStaffId('') }} placeholder="Start typing name..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 4 }} />
                  {leaveStaffSearch.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      {filteredStaff.slice(0, 5).map(st => (
                        <div key={st.id} onClick={() => { setLeaveStaffId(st.id); setLeaveStaffSearch(st.name) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: leaveStaffId === st.id ? '#f8fafc' : '#fff', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{st.name}</span>
                          <span style={{ color: '#64748b', fontSize: 11 }}>{st.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLeavePopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={confirmLeave} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Big Bulk Action Popup */}
      {showBulkActionPanel && selected.length > 0 && (
        <div
          onClick={() => setShowBulkActionPanel(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.62)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 760,
              background: '#ffffff',
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 34px 100px rgba(15,23,42,0.38)',
            }}
          >
            <div
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 18,
              }}
            >
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {selected.length} Students Selected
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 5 }}>
                  Apply one classroom action to all selected students
                </div>
              </div>
              <button
                onClick={() => setShowBulkActionPanel(false)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 24,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 28 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Selected students</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {filtered.filter(s => selected.includes(s.id)).map(st => (
                    <span key={st.id} style={{ padding: '5px 10px', borderRadius: 999, background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontSize: 12, fontWeight: 700 }}>
                      {st.name}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#334155', marginBottom: 12 }}>
                  Add Points to Selected
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[1, 2, 3, 5].map(amount => (
                    <button
                      key={amount}
                      onClick={() => {
                        playSound('positive')
                        setStudents(prev => prev.map(x => selected.includes(x.id) ? {
                          ...x,
                          points: x.points + amount,
                          behaviorLog: [{ label: `Bulk +${amount}`, points: amount, date: new Date().toISOString().slice(0,10) }, ...(x.behaviorLog || [])].slice(0, 30)
                        } : x))
                        setShowBulkActionPanel(false)
                      }}
                      style={{
                        padding: '22px 12px',
                        borderRadius: 18,
                        border: '1px solid #bbf7d0',
                        background: '#f0fdf4',
                        color: '#315c3f',
                        fontSize: 24,
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#334155', marginBottom: 12 }}>
                  Deduct / Reminder for Selected
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Reminder', amount: -1, reminder: true },
                    { label: '-1 Point', amount: -1, reminder: false },
                    { label: '-2 Points', amount: -2, reminder: false },
                  ].map(action => (
                    <button
                      key={action.label}
                      onClick={() => {
                        playSound('negative')
                        setStudents(prev => prev.map(x => selected.includes(x.id) ? {
                          ...x,
                          points: Math.max(0, x.points + action.amount),
                          reminders: action.reminder ? x.reminders + 1 : x.reminders,
                          behaviorLog: [{ label: `Bulk ${action.label}`, points: action.amount, date: new Date().toISOString().slice(0,10) }, ...(x.behaviorLog || [])].slice(0, 30)
                        } : x))
                        setShowBulkActionPanel(false)
                      }}
                      style={{
                        padding: '20px 12px',
                        borderRadius: 18,
                        border: '1px solid #fecaca',
                        background: '#fff7f7',
                        color: '#8f1f3f',
                        fontSize: 17,
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Big Quick Action Popup */}
      {quickActionStudent && (
        <div
          onClick={() => setQuickActionStudent(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.62)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 760,
              background: '#ffffff',
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 34px 100px rgba(15,23,42,0.38)',
            }}
          >
            <div
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 18,
              }}
            >
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {quickActionStudent.name}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 5 }}>
                  Classroom quick action
                </div>
              </div>
              <button
                onClick={() => setQuickActionStudent(null)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 24,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 26 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: '#334155' }}>{quickActionStudent.points}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 4 }}>Points</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: quickActionStudent.reminders >= 4 ? '#9f1239' : '#334155' }}>{quickActionStudent.reminders}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 4 }}>Reminders</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: quickActionStudent.status === 'present' ? '#4b6854' : '#64748b', marginTop: 8 }}>
                    {quickActionStudent.status === 'present' ? 'In Class' : statusLabel[quickActionStudent.status] || quickActionStudent.status}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 9 }}>Status</div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#334155', marginBottom: 12 }}>
                  Add Points
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[1, 2, 3, 5].map(amount => (
                    <button
                      key={amount}
                      onClick={async () => {
                        playSound('positive')
                        await recordStudentPointsAction({
                          studentId: quickActionStudent.id,
                          pointsDelta: amount,
                          reason: `Quick +${amount}`,
                          eventType: 'award',
                          category: 'teaching',
                          sourceContext: 'teaching-mode-quick-action',
                        })
                        setQuickActionStudent(null)
                      }}
                      style={{
                        padding: '22px 12px',
                        borderRadius: 18,
                        border: '1px solid #bbf7d0',
                        background: '#f0fdf4',
                        color: '#315c3f',
                        fontSize: 24,
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#334155', marginBottom: 12 }}>
                  Deduct / Reminder
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Reminder', amount: -1, reminder: true },
                    { label: '-1 Point', amount: -1, reminder: false },
                    { label: '-2 Points', amount: -2, reminder: false },
                  ].map(action => (
                    <button
                      key={action.label}
                      onClick={async () => {
                        playSound('negative')
                        await recordStudentPointsAction({
                          studentId: quickActionStudent.id,
                          pointsDelta: action.amount,
                          reminderDelta: action.reminder ? 1 : 0,
                          reason: action.label,
                          eventType: action.reminder ? 'reminder' : 'deduction',
                          category: 'teaching',
                          sourceContext: 'teaching-mode-quick-action',
                        })
                        setQuickActionStudent(null)
                      }}
                      style={{
                        padding: '20px 12px',
                        borderRadius: 18,
                        border: '1px solid #fecaca',
                        background: '#fff7f7',
                        color: '#8f1f3f',
                        fontSize: 17,
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teaching Mode Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #dde5ef',
        boxShadow: '0 5px 20px rgba(26,43,68,0.065)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0
      }}>
        <div style={{
          maxWidth: 1660,
          margin: '0 auto',
          padding: '13px 24px 11px',
          display: 'flex',
          alignItems: 'center',
          gap: 18
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            minWidth: 185
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(145deg, #edf4ff, #ffffff)',
              border: '1px solid #cddbed',
              boxShadow: '0 4px 12px rgba(42,79,124,0.09)',
              display: 'grid',
              placeItems: 'center'
            }}>
              <div style={{
                fontSize: 20,
                fontWeight: 900,
                color: '#2d5b91',
                lineHeight: 1
              }}>
                📖
              </div>
            </div>

            <div>
              <div style={{
                fontSize: 16,
                fontWeight: 900,
                color: '#17243a',
                letterSpacing: '-0.02em'
              }}>
                {isAdmin ? 'School-Wide Mode' : 'Teaching Mode'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 1 }}>
                School Day &gt; Teaching Mode
              </div>
              <div
                dir="rtl"
                style={{
                  fontSize: 11,
                  color: '#4d6f98',
                  fontWeight: 900,
                  marginTop: 2,
                  textAlign: 'left'
                }}
              >
                הדרן
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 0,
            overflowX: 'auto',
            paddingBottom: 2
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, color: '#52637a', fontWeight: 800, whiteSpace: 'nowrap' }}>Scope</div>
              <select
                value={scopeType}
                onChange={event => setScopeType(event.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 9,
                  border: '1px solid #d6e0ec',
                  background: '#ffffff',
                  color: '#233952',
                  fontSize: 11,
                  fontWeight: 800,
                  minWidth: 178,
                }}
              >
                {scopeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {scopeType === 'class' && (
                <select
                  value={selectedClass || ''}
                  onChange={event => setSelectedClass(event.target.value || null)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 9,
                    border: '1px solid #d6e0ec',
                    background: '#ffffff',
                    color: '#233952',
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 162,
                  }}
                >
                  <option value="">All Classes</option>
                  {classOptions.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              )}

              {scopeType === 'teacher' && (
                <select
                  value={selectedTeacher}
                  onChange={event => setSelectedTeacher(event.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 9,
                    border: '1px solid #d6e0ec',
                    background: '#ffffff',
                    color: '#233952',
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 170,
                  }}
                >
                  <option value="">All Teachers</option>
                  {teacherOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}

              {scopeType === 'grade' && (
                <select
                  value={selectedGrade}
                  onChange={event => setSelectedGrade(event.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 9,
                    border: '1px solid #d6e0ec',
                    background: '#ffffff',
                    color: '#233952',
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 145,
                  }}
                >
                  <option value="">All Grades</option>
                  {gradeOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}

              {scopeType === 'period' && (
                <select
                  value={selectedPeriod}
                  onChange={event => setSelectedPeriod(event.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 9,
                    border: '1px solid #d6e0ec',
                    background: '#ffffff',
                    color: '#233952',
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 120,
                  }}
                >
                  {periodOptions.length === 0 && <option value="">No Periods</option>}
                  {periodOptions.map(period => (
                    <option key={period} value={period}>Period {period}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{
            position: 'relative',
            width: 210,
            flexShrink: 0
          }}>
            <span style={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8794a6',
              fontSize: 13
            }}>
              ⌕
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 11px 9px 31px',
                borderRadius: 10,
                border: '1px solid #d5dfeb',
                background: '#f7faff',
                color: '#24344b',
                fontSize: 12,
                outline: 'none'
              }}
            />
          </div>

          <div style={{
            padding: '8px 11px',
            borderRadius: 10,
            background: '#f7f9fc',
            border: '1px solid #dce4ee',
            textAlign: 'center',
            flexShrink: 0
          }}>
            <div style={{
              fontSize: 9,
              color: '#77869a',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              In Class
            </div>
            <div style={{
              fontSize: 13,
              color: '#213a5a',
              fontWeight: 900,
              marginTop: 1
            }}>
              {filtered.filter(isStudentInClass).length}/{filtered.length}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 7,
            flexShrink: 0
          }}>
            {!sessionActive ? (
              <button
                onClick={startSession}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1px solid #315f91',
                  background: '#315f91',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 5px 14px rgba(49,95,145,0.18)'
                }}
              >
                ▶ Start Class
              </button>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 11px',
                  borderRadius: 10,
                  background: '#f6f9fd',
                  border: '1px solid #d8e3ef'
                }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#718096', fontWeight: 800 }}>
                      INTERVAL {intervalNum}
                    </div>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: progress > 80 ? '#9a6a2a' : '#244d7c',
                      fontFamily: 'monospace'
                    }}>
                      {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
                    </div>
                  </div>
                  <div style={{
                    width: 65,
                    height: 5,
                    borderRadius: 999,
                    overflow: 'hidden',
                    background: '#dfe7f0'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: progress > 80 ? '#c28a3b' : '#587dae',
                      transition: 'width 1s'
                    }} />
                  </div>
                </div>

                <button
                  onClick={nextInterval}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #bcd0e8',
                    background: '#f7fbff',
                    color: '#315f91',
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  🔔 Chime
                </button>

                <button
                  onClick={endSession}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #e6b9c4',
                    background: '#fff7f9',
                    color: '#94344d',
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  ⏹ End
                </button>
              </>
            )}

            <button
              onClick={() => {
                setSelected(filtered.filter(isStudentInClass).map(s => s.id))
                setShowTeachingActions(true)
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid #d5dfeb',
                background: '#ffffff',
                color: '#44546a',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ☑ Select All
            </button>

            <button
              onClick={async () => {
                const snapshot = students
                setStudents(prev => prev.map(s => ({
                  ...s,
                  status: 'present',
                  dailyStatus: 'present',
                  withStaff: null
                })))
                const success = await persistStudentFieldsBulk(
                  students.map(s => ({
                    id: s.id,
                    fields: {
                      status: 'present',
                      dailyStatus: 'present'
                    }
                  }))
                )
                if (!success) {
                  setStudents(snapshot)
                  alert('Unable to save all student statuses to Supabase.')
                }
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid #cfe0d3',
                background: '#f4faf6',
                color: '#466950',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ✅ All Present
            </button>

            <button
              onClick={onExit}
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid #e3c5cc',
                background: '#fff',
                color: '#934158',
                fontSize: 11,
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              ← Back to School Day
            </button>
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div style={{
          background: '#f8fbff',
          borderBottom: '1px solid #dce6f1',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          boxShadow: '0 3px 10px rgba(31,52,78,0.035)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#172033' }}>
            Choose action for {selected.length} student{selected.length === 1 ? '' : 's'}
          </div>

          <div style={{
            display: 'flex',
            gap: 5,
            flexWrap: 'wrap',
            flex: 1,
            minWidth: 160
          }}>
            {selected.slice(0, 5).map(id => {
              const student = students.find(s => s.id === id)
              return student ? (
                <span key={id} style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: '#f1f5f9',
                  border: '1px solid #dbe3ee',
                  color: '#334155',
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  {student.name}
                </span>
              ) : null
            })}
            {selected.length > 5 && (
              <span style={{ fontSize: 11, color: '#64748b', padding: '4px 2px' }}>
                +{selected.length - 5} more
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setSelected([])
              setShowTeachingActions(false)
            }}
            style={{ ...S.btn('ghost'), padding: '7px 12px', fontSize: 12 }}
          >
            Clear
          </button>
        </div>
      )}

      {selected.length > 0 && (
        <div
          onClick={closeTeachingActions}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(29,45,68,0.16)',
            zIndex: 320,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'flex-end',
            padding: 0
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(430px, 94vw)',
              height: '100%',
              maxHeight: '100vh',
              background: '#fff',
              borderRadius: '18px 0 0 18px',
              boxShadow: '-18px 0 55px rgba(28,45,68,0.18)',
              borderLeft: '1px solid #d7e1ed',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              padding: '15px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#172033' }}>
                  Class Actions
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                  Apply to {selected.length} selected student{selected.length === 1 ? '' : 's'}
                </div>
              </div>

              <button
                onClick={closeTeachingActions}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #d8dee9',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#475569'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid #eef2f7',
              background: '#f8fafc'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                marginBottom: 9
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  Select Students
                </div>

                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: selected.length > 0 ? '#365f43' : '#64748b'
                }}>
                  {selected.length} selected
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                gap: 6,
                maxHeight: 155,
                overflowY: 'auto',
                paddingRight: 3
              }}>
                {classStudents.map(student => {
                  const isChosen = selected.includes(student.id)

                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleSelect(student.id)}
                      aria-pressed={isChosen}
                      style={{
                        minWidth: 0,
                        padding: '8px 9px',
                        borderRadius: 9,
                        border: isChosen
                          ? '2px solid #5f84bb'
                          : '1px solid #d8e0e9',
                        background: isChosen
                          ? '#ffffff'
                          : '#eef1f5',
                        color: isChosen
                          ? '#172033'
                          : '#7b8492',
                        boxShadow: isChosen
                          ? '0 4px 12px rgba(49,91,145,0.14)'
                          : 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: isChosen ? 900 : 700,
                        textAlign: 'left',
                        opacity: isChosen ? 1 : 0.66,
                        transition: 'all 0.14s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6
                      }}
                    >
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {student.name}
                      </span>

                      {isChosen && (
                        <span style={{
                          width: 17,
                          height: 17,
                          flexShrink: 0,
                          borderRadius: 999,
                          background: '#4f76ad',
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 10,
                          fontWeight: 900
                        }}>
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div style={{
                marginTop: 8,
                fontSize: 10.5,
                color: '#64748b'
              }}>
                Bright names will receive the selected action. Click another name to include or remove him.
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: 18 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 900,
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 9
              }}>
                Quick Points
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 8,
                marginBottom: 20
              }}>
                {[1, 2, 5, 10].map(amount => (
                  <button
                    key={amount}
                    onClick={() => applyToSelected(amount, `Quick +${amount}`)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 10,
                      border: '1px solid #b9d7c2',
                      background: '#f4faf6',
                      color: '#274c33',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 900
                    }}
                  >
                    +{amount}
                  </button>
                ))}
              </div>

              <div style={{
                fontSize: 12,
                fontWeight: 900,
                color: '#2f5d3b',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 9
              }}>
                Praise & Responsibilities
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                gap: 8,
                marginBottom: 20
              }}>
                {BEHAVIORS_POSITIVE.map(b => (
                  <button
                    key={b.id}
                    onClick={() => applyToSelected(b.points, b.label)}
                    style={{
                      padding: '11px 12px',
                      borderRadius: 10,
                      border: '1px solid #b9d7c2',
                      background: '#f4faf6',
                      color: '#274c33',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <span>{b.label}</span>
                    <span>+{b.points}</span>
                  </button>
                ))}

                <button
                  onClick={() => applyToSelected(10, 'Bonus')}
                  style={{
                    padding: '11px 12px',
                    borderRadius: 10,
                    border: '1px solid #b9d7c2',
                    background: '#eef7f1',
                    color: '#274c33',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Bonus</span>
                  <span>+10</span>
                </button>
              </div>

              <div style={{
                fontSize: 12,
                fontWeight: 900,
                color: '#8f3a50',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 9
              }}>
                Behavior Deductions
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                gap: 8
              }}>
                {BEHAVIORS_NEGATIVE.map(b => (
                  <button
                    key={b.id}
                    onClick={() => applyToSelected(b.points, b.label)}
                    style={{
                      padding: '11px 12px',
                      borderRadius: 10,
                      border: '1px solid #fecaca',
                      background: '#fff7f7',
                      color: '#881337',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <span>{b.label}</span>
                    <span>{b.points}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                The leave-class switch and required reason remain on each student card.
              </div>
              <button
                onClick={closeTeachingActions}
                style={S.btn('ghost')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '18px 30px 34px',
        background: '#f4f6f9'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
          gap: 13,
          alignContent: 'start',
          width: '100%',
          maxWidth: 1540,
          margin: '0 auto'
        }}>
          {filtered.map((s, i) => {
            const isSelected = selected.includes(s.id)
            const vip = isVIP(s)
            const inClass = isStudentInClass(s)
            const isAbsent =
              s.dailyStatus === 'absent' || s.status === 'absent'
            const isPulledOut =
              s.status === 'therapy' || s.status === 'with-bt'
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            const thisIntervalReminders = intervalReminders[s.id] || 0
            const unavailableReason =
              s.dailyStatus === 'absent' ? 'Absent' :
              s.dailyStatus === 'left-early' ? 'Left Early' :
              s.status === 'therapy' ? 'In Therapy' :
              s.status === 'with-bt' ? 'With BT' :
              s.status === 'unknown' ? 'Location Unknown' :
              s.status === 'not-arrived' ? 'Not Arrived' :
              'Not In Class'
            return (
              <div
                key={s.id}
                onClick={() => toggleSelect(s.id)}
                style={{
                  background: inClass
                    ? '#ffffff'
                    : isSelected
                      ? '#f3f7ff'
                      : isAbsent
                      ? '#cbd5e1'
                      : s.status === 'unknown'
                        ? '#fee2e2'
                        : isPulledOut
                          ? '#e8eef7'
                          : inClass
                            ? '#ffffff'
                            : '#e5e7eb',
                  opacity: isAbsent ? 0.92 : isPulledOut ? 0.82 : inClass ? 1 : 0.76,
                  border: `1.5px solid ${
                    isSelected
                      ? '#5d85bf'
                      : isAbsent
                        ? '#94a3b8'
                        : s.status === 'unknown'
                          ? '#fca5a5'
                          : isPulledOut
                            ? '#b8c9df'
                            : inClass
                              ? '#d6e0eb'
                              : '#cbd5e1'
                  }`,
                  boxShadow: isSelected
                    ? '0 9px 24px rgba(47,86,138,0.16)'
                    : inClass
                      ? '0 5px 16px rgba(32,48,70,0.055)'
                      : '0 3px 10px rgba(32,48,70,0.025)',
                  borderRadius: 14,
                  padding: '13px',
                  position: 'relative',
                  filter: inClass ? 'none' : 'grayscale(0.12)',
                  transition: 'background 0.15s, opacity 0.15s, box-shadow 0.15s, border 0.15s, transform 0.15s',
                  cursor: 'pointer',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  minHeight: 126
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 7,
                    right: vip ? 30 : 7,
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: '#3f70b7',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                    zIndex: 2
                  }}>
                    ✓
                  </div>
                )}
                {vip && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 13 }}>⭐</div>}
                {sessionActive && thisIntervalReminders > 0 && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: '#9f1239', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>⚠️ {thisIntervalReminders}</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ ...S.avatar(i, 32), outline: isSelected ? '3px solid #6e91c5' : 'none' }}>
                    {initials(s.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 12.5, color: '#27364c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    {withStaffObj ? <div style={{ fontSize: 10, color: '#3f6b76', fontWeight: 600 }}>👤 {withStaffObj.name}</div> : <span style={{ ...S.tag(statusColor[s.status]), fontSize: 10 }}>{statusEmoji[s.status]}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                  {s.reminders > 0 && <span style={S.badge('#9f1239', '#fee2e2')}>⚠️ {s.reminders}</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #edf1f5' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: inClass ? '#4b6854' : '#64748b',
                      background: inClass ? '#eef4f0' : '#e2e8f0',
                      border: `1px solid ${inClass ? '#cfe0d3' : '#cbd5e1'}`,
                      padding: '2px 7px',
                      borderRadius: 999,
                    }}>{inClass ? '✅ In Class' : `□ ${unavailableReason}`}</span>
                    {inClass && s.dailyStatus === 'late' && <button onClick={e => { e.stopPropagation(); setLateClassPopup(s.id); setLateClassStaffSearch(''); setLateClassStaffId(''); setLateClassNote('') }} style={{ padding: '2px 6px', borderRadius: 14, border: '1px solid #e8d7b6', background: '#fbf7ef', color: '#8a6428', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>⏰ Arrived Late</button>}
                  </div>
                  <div
                    onClick={e => {
                      e.stopPropagation()
                      handleToggle(s)
                    }}
                    title={inClass ? 'Mark student as leaving class' : 'Return student to class'}
                    style={{ width: 40, height: 22, borderRadius: 11, background: inClass ? '#56765f' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: inClass ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

