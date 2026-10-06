import { useEffect, useRef, useState } from 'react'
import { AlarmClock, ArrowLeft, ArrowDown, ArrowUp, Check, CheckCheck, Clock3, LogIn, LogOut, Settings2, SlidersHorizontal, Users, X, RefreshCw, RotateCcw, CircleCheck, CircleAlert } from 'lucide-react'
import type { ShachrisSession, ShachrisSettings } from '../services/shachrisService'
import type { ShachrisBackend } from '../services/shachrisBackend'
import { calculateShachrisMinutesLate, calculateShachrisMinutesOut, completePresentShachrisRequirements, completeShachrisExpectation, hasMetShachrisExpectation, latestOpenShachrisLeave, localDateKey, nextShachrisSection, type ShachrisAssignment, type ShachrisRecord, type ShachrisStayAssignment } from '../utils/shachris'
import ShachrisSettingsEditor from './ShachrisSettingsEditor'
import './ShachrisWorkspace.css'

type Student = { id: number | string; name?: string; is_active?: boolean; age?: number | null }
type Props = {
  backend: ShachrisBackend
  liveOnly?: boolean
  students: Student[]
  classes: Array<{ id: number | string; name: string }>
  primaryClassIdsByStudent: Record<string | number, string>
  instructionalGroups: Array<{ id: string; name?: string; status?: string }>
  instructionalGroupMemberships: Array<{ group_id: string; student_id: number }>
  actorName: string
  role: string
  onClose?: () => void
}

function errorMessage(caught: unknown): string {
  if (caught && typeof caught === 'object' && 'message' in caught) return String(caught.message)
  return 'Could not save. Reload and try again.'
}

function formatTime(value: string | null | undefined): string {
  if (!value) return '--:--'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatMinutes(value: number): string {
  return `${value} min`
}

export default function ShachrisWorkspace({ backend, liveOnly = false, students, classes, primaryClassIdsByStudent, instructionalGroups, instructionalGroupMemberships, actorName, role, onClose }: Props) {
  const { bulkArriveAtShachrisStart, loadShachrisProgression, loadShachrisSettings, loadShachrisStayHistory, markShachrisMilestone, openShachrisSession, recordShachrisPresenceEvent, saveShachrisExpectation, saveShachrisRecords, saveShachrisStayRequirement, startShachrisSession, loadAccess } = backend
  const [date, setDate] = useState(localDateKey)
  const [scope, setScope] = useState('all')
  const [search, setSearch] = useState('')
  const [session, setSession] = useState<ShachrisSession | null>(null)
  const [settings, setSettings] = useState<ShachrisSettings | null>(null)
  const [records, setRecords] = useState<ShachrisRecord[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [resolvedRequest, setResolvedRequest] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [reload, setReload] = useState(0)
  const [view, setView] = useState<'live' | 'settings'>('live')
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [milestoneId, setMilestoneId] = useState('')
  const [requiredIds, setRequiredIds] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState<'today' | 'future'>('today')
  const [history, setHistory] = useState<ShachrisAssignment[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [editingStayStudent, setEditingStayStudent] = useState<Student | null>(null)
  const [stayRequirementId, setStayRequirementId] = useState('')
  const [stayReason, setStayReason] = useState('')
  const [stayDuration, setStayDuration] = useState<'today' | 'future'>('today')
  const [stayHistory, setStayHistory] = useState<ShachrisStayAssignment[]>([])
  const [stayHistoryLoading, setStayHistoryLoading] = useState(false)
  const [stayHistoryError, setStayHistoryError] = useState('')
  const [clockNow, setClockNow] = useState(0)
  const busyRef = useRef(false)
  const activeStudents = students.filter(student => student.is_active !== false).sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
  const studentIdsKey = activeStudents.map(student => Number(student.id)).filter(Number.isFinite).sort((left, right) => left - right).join(',')
  const requestKey = `${date}:${studentIdsKey}:${reload}:${role}`
  const loading = resolvedRequest !== requestKey
  const groupIds = new Set(instructionalGroupMemberships.filter(member => member.group_id === scope.replace('group:', '')).map(member => member.student_id))
  const visibleStudents = activeStudents.filter(student => (scope === 'all' || (scope.startsWith('group:') ? groupIds.has(Number(student.id)) : primaryClassIdsByStudent[student.id] === scope.replace('class:', '')))
    && String(student.name || '').toLowerCase().includes(search.toLowerCase()))
  const visibleIds = new Set(visibleStudents.map(student => Number(student.id)))
  const visibleRecords = records.filter(record => visibleIds.has(record.student_id))
  const presentRequirements = completePresentShachrisRequirements(visibleRecords)
  const locked = loading || saving || !canEdit || !session
  const today = date === localDateKey()

  useEffect(() => {
    const firstTick = window.setTimeout(() => setClockNow(Date.now()), 0)
    const timer = window.setInterval(() => setClockNow(Date.now()), 30000)
    return () => { window.clearTimeout(firstTick); window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    let canceled = false
    void (async () => {
      try {
        const [loadedSettings, permissions] = await Promise.all([loadShachrisSettings(), loadAccess(role)])
        const opened = await openShachrisSession(date, studentIdsKey ? studentIdsKey.split(',').map(Number) : [])
        if (canceled) return
        setSettings(loadedSettings)
        setCanEdit(permissions.canEdit)
        setCanManage(permissions.canManage)
        setSession(opened.session)
        setRecords(opened.records)
        setError('')
        setStatus('')
      } catch (caught) {
        if (!canceled) {
          setSession(null)
          setRecords([])
          setError(errorMessage(caught))
        }
      } finally {
        if (!canceled) setResolvedRequest(`${date}:${studentIdsKey}:${reload}:${role}`)
      }
    })()
    return () => { canceled = true }
  }, [date, studentIdsKey, reload, role, loadShachrisSettings, loadAccess, openShachrisSession])

  useEffect(() => {
    if (!editingStudent) return
    let canceled = false
    void loadShachrisProgression(Number(editingStudent.id)).then(rows => { if (!canceled) setHistory(rows) }).catch(caught => { if (!canceled) setHistoryError(errorMessage(caught)) }).finally(() => { if (!canceled) setHistoryLoading(false) })
    return () => { canceled = true }
  }, [editingStudent, loadShachrisProgression])

  useEffect(() => {
    if (!editingStayStudent) return
    let canceled = false
    void loadShachrisStayHistory(Number(editingStayStudent.id)).then(rows => { if (!canceled) setStayHistory(rows) }).catch(caught => { if (!canceled) setStayHistoryError(errorMessage(caught)) }).finally(() => { if (!canceled) setStayHistoryLoading(false) })
    return () => { canceled = true }
  }, [editingStayStudent, loadShachrisStayHistory])

  async function updateRecords(changed: ShachrisRecord[]) {
    if (busyRef.current || locked || !session || !changed.length) return
    busyRef.current = true
    setSaving(true)
    setError('')
    setStatus('')
    const previous = records
    const changedById = new Map(changed.map(record => [record.student_id, record]))
    setRecords(previous.map(record => changedById.get(record.student_id) || record))
    try {
      const saved = await saveShachrisRecords(session.id, changed, actorName)
      const savedById = new Map(saved.map(record => [record.student_id, record]))
      setRecords(previous.map(record => savedById.get(record.student_id) || record))
      setStatus('All changes saved')
    } catch (caught) {
      setRecords(previous)
      setError(errorMessage(caught))
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  async function runAttendanceAction(action: () => Promise<ShachrisRecord[] | ShachrisRecord>, successMessage: string) {
    if (busyRef.current || locked) return
    busyRef.current = true
    setSaving(true)
    setError('')
    setStatus('')
    try {
      const result = await action()
      const saved = Array.isArray(result) ? result : [result]
      const savedById = new Map(saved.map(record => [record.student_id, record]))
      setRecords(previous => previous.map(record => savedById.get(record.student_id) || record))
      setStatus(successMessage)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  async function startSession() {
    if (!session || locked || !today || busyRef.current) return
    busyRef.current = true
    setSaving(true)
    setError('')
    try {
      const started = await startShachrisSession(session.id, actorName)
      setSession(started)
      setStatus('Hodu started. Session time is set.')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  async function bulkArriveAtStart() {
    if (!session || !visibleRecords.length) return
    const ids = visibleRecords.filter(record => !record.arrival_at && record.presence !== 'left').map(record => record.student_id)
    await runAttendanceAction(() => bulkArriveAtShachrisStart(session.id, ids, actorName), `Marked ${ids.length} students In Shul at Hodu.`)
  }

  async function markCommunalMilestone(milestoneId: string) {
    if (!session || locked || busyRef.current) return
    busyRef.current = true
    setSaving(true)
    setError('')
    try {
      const result = await markShachrisMilestone(session.id, milestoneId, actorName)
      setSession(result.session)
      setRecords(result.records)
      setStatus(result.alreadyMarked ? 'Milestone was already recorded.' : `Milestone marked: ${result.metCount} met, ${result.notMetCount} not met.`)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  async function saveStayRequirement(mode: 'manual' | 'default') {
    if (!editingStayStudent || !session || locked || busyRef.current || !today) return
    const record = records.find(entry => entry.student_id === Number(editingStayStudent.id))
    if (!record) return
    busyRef.current = true
    setSaving(true)
    setError('')
    setStayHistoryError('')
    try {
      const changed = await saveShachrisStayRequirement({ studentId: record.student_id, mode, requiredUntil: mode === 'manual' ? stayRequirementId : null, reason: stayReason, actorName, session, revision: record.revision, duration: stayDuration })
      setRecords(previous => previous.map(entry => entry.student_id === record.student_id ? changed.record : entry))
      setStayHistory(previous => [changed.assignment, ...previous])
      setStatus(stayDuration === 'today' ? 'Stay requirement saved for today only.' : 'Stay requirement saved for today and future.')
      setStayReason('')
    } catch (caught) {
      setStayHistoryError(errorMessage(caught))
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  function openStayRequirement(student: Student, record: ShachrisRecord) {
    setStayHistory([])
    setStayHistoryError('')
    setStayHistoryLoading(true)
    setStayRequirementId(record.stay_requirement.requiredUntil || session?.config.stayRules.find(rule => rule.age === record.stay_requirement.age)?.milestoneId || 'shemoneh-esrei')
    setStayReason('')
    setStayDuration('today')
    setEditingStayStudent(student)
  }

  function openExpectation(student: Student, record: ShachrisRecord) {
    setHistory([])
    setHistoryError('')
    setHistoryLoading(true)
    setError('')
    setEditingStudent(student)
    setMilestoneId(record.expectation.milestoneId)
    setRequiredIds([...record.expectation.sectionIds])
    setReason('')
    setDuration('today')
  }

  async function changeExpectation(mode: 'manual' | 'default') {
    if (!editingStudent || !session || locked || busyRef.current || !today) return
    const record = records.find(entry => entry.student_id === Number(editingStudent.id))
    if (!record) return
    busyRef.current = true
    setSaving(true)
    setError('')
    try {
      const changed = await saveShachrisExpectation({ studentId: record.student_id, mode, milestoneId, sectionIds: requiredIds, reason, actorName, session, revision: record.revision, duration })
      setRecords(previous => previous.map(entry => entry.student_id === record.student_id ? changed.record : entry))
      setHistory(previous => [changed.assignment, ...previous])
      setMilestoneId(changed.record.expectation.milestoneId)
      setRequiredIds([...changed.record.expectation.sectionIds])
      setStatus(duration === 'today' ? 'Expectation saved for today only' : 'Expectation saved for today and future sessions')
      setReason('')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  const currentRecord = records.find(record => record.student_id === Number(editingStudent?.id))
  const currentStayRecord = records.find(record => record.student_id === Number(editingStayStudent?.id))
  const config = session?.config
  const selectedMilestoneIndex = config?.milestones.findIndex(milestone => milestone.id === milestoneId) ?? -1
  function selectMilestone(id: string) {
    setMilestoneId(id)
    setRequiredIds([...(config?.milestones.find(milestone => milestone.id === id)?.sectionIds || [])])
  }

  return <div className="shachris sh-live-screen">
    <header className="shachris-heading sh-live-heading">
      <div>{onClose && <button className="sh-back" disabled={saving} onClick={onClose}><ArrowLeft size={16} /> School Day</button>}<h1>Shachris Attendance</h1><span className="sh-subtitle">Daily Live Session</span></div>
      <div className="sh-heading-actions"><label className="sh-date-control"><span>Date</span><input type="date" aria-label="Session date" value={date} max={localDateKey()} disabled={liveOnly || saving || loading} onChange={event => { if (event.target.value) { setDate(event.target.value); setEditingStudent(null); setEditingStayStudent(null) } }} /></label><span role="status" className="sh-save-status">{loading ? 'Loading...' : saving ? 'Saving...' : status || (canEdit ? 'Ready' : 'View only')}</span><button className="sh-icon" title="Reload saved session" aria-label="Reload saved session" disabled={saving || loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={18} /></button>{!liveOnly && <button className={view === 'settings' ? 'sh-button active' : 'sh-button'} disabled={saving || loading || !settings} onClick={() => setView(view === 'settings' ? 'live' : 'settings')}>{view === 'settings' ? <Users size={17} /> : <Settings2 size={17} />}{view === 'settings' ? 'Live Session' : 'Rules & Settings'}</button>}</div>
    </header>
    {error && <div className="sh-error" role="alert">{error}</div>}
    {!liveOnly && view === 'settings' && settings ? <ShachrisSettingsEditor key={settings.revision} settings={settings} canEdit={canManage} saveSettings={backend.saveShachrisSettings} onSaved={saved => { setSettings(saved); setStatus('Shachris settings saved.') }} /> : <>
      <div className="sh-live-filters"><label>Roster<select aria-label="Class or group" value={scope} disabled={saving} onChange={event => setScope(event.target.value)}><option value="all">Entire roster</option>{classes.map(entry => <option key={entry.id} value={`class:${entry.id}`}>{entry.name}</option>)}{instructionalGroups.filter(group => group.status !== 'archived').map(group => <option key={group.id} value={`group:${group.id}`}>{group.name || group.id}</option>)}</select></label><label className="sh-search"><span>Search students</span><input type="search" aria-label="Find student" placeholder="Search students..." value={search} disabled={saving} onChange={event => setSearch(event.target.value)} /></label></div>
      <section className="sh-communal-milestones" aria-label="Communal Shachris milestones">
        <div className={`sh-communal-milestone sh-hodu ${session?.started_at ? 'complete' : ''}`}><div><span className="sh-milestone-dot">{session?.started_at ? <Check size={16} /> : <AlarmClock size={17} />}</span><strong>Start Hodu</strong></div>{session?.started_at ? <time>{formatTime(session.started_at)}</time> : <button className="sh-start-hodu" disabled={locked || !today} onClick={() => void startSession()}>Start Session</button>}</div>
        {(config?.stayMilestones || []).filter(milestone => milestone.id !== 'hodu').map(milestone => {
          const markedAt = session?.milestone_times?.[milestone.id]
          const previousId = milestone.order === 1 ? 'hodu' : config?.stayMilestones.find(entry => entry.order === milestone.order - 1)?.id
          const ready = Boolean(session?.started_at && previousId && session.milestone_times?.[previousId])
          return <div key={milestone.id} className={`sh-communal-milestone ${markedAt ? 'complete' : ''} ${ready && !markedAt ? 'next' : ''}`}>
            <div><span className="sh-milestone-dot">{markedAt ? <Check size={16} /> : <Clock3 size={17} />}</span><strong>{milestone.label}</strong></div>
            {markedAt ? <time>{formatTime(markedAt)}</time> : <button className="sh-mark-milestone" disabled={locked || !today || !ready} onClick={() => void markCommunalMilestone(milestone.id)}>Mark Now</button>}
          </div>
        })}
      </section>
      <div className="sh-live-stats">
        {[
          { label: 'In Shul', value: visibleRecords.filter(record => record.presence === 'present').length, detail: `of ${visibleRecords.length} students`, tone: 'green', icon: <Users size={21} /> },
          { label: 'Late', value: visibleRecords.filter(record => { const minutes = calculateShachrisMinutesLate(session?.started_at, record.arrival_at); return minutes !== null && minutes > 0 }).length, detail: session?.started_at ? `arrived after ${formatTime(session.started_at)}` : 'after Hodu starts', tone: 'amber', icon: <Clock3 size={21} /> },
          { label: 'Out / Left', value: visibleRecords.filter(record => record.presence === 'left').length, detail: 'currently out', tone: 'red', icon: <LogOut size={21} /> },
          { label: 'Met Requirement', value: visibleRecords.filter(record => record.requirement_result === 'met').length, detail: visibleRecords.length ? `${Math.round(visibleRecords.filter(record => record.requirement_result === 'met').length / visibleRecords.length * 100)}% of students` : 'no students', tone: 'green', icon: <CircleCheck size={21} /> },
          { label: 'Need Attention', value: visibleRecords.filter(record => record.presence !== 'present' && record.requirement_result === 'pending' || record.requirement_result === 'not_met' || !record.stay_requirement.requiredUntil).length, detail: 'late, out, or requirement unset', tone: 'orange', icon: <CircleAlert size={21} /> },
        ].map(stat => <div className={`sh-live-stat ${stat.tone}`} key={stat.label}><span className="sh-stat-icon">{stat.icon}</span><div><strong>{stat.value}</strong><b>{stat.label}</b><small>{stat.detail}</small></div></div>)}
      </div>
      <div className="sh-live-toolbar"><strong>{visibleRecords.length} students</strong><button className="sh-button sh-primary" disabled={locked || !session?.started_at || !visibleRecords.some(record => !record.arrival_at && record.presence !== 'left')} onClick={() => void bulkArriveAtStart()}><Users size={16} /> Mark Visible In Shul at Hodu</button></div>
      <details className="sh-progress-bulk"><summary><CheckCheck size={15} /> Davening Progress Tools <span>Secondary checklist actions</span></summary><div><strong>{visibleRecords.length} visible students</strong><button className="sh-button" disabled={locked || !presentRequirements.length} onClick={() => void updateRecords(presentRequirements)}><CheckCheck size={16} /> Complete Present Sections</button><select aria-label="Set rating for visible students" disabled={locked || !visibleRecords.length} value="" onChange={event => { const rating = event.target.value; void updateRecords(visibleRecords.map(record => ({ ...record, rating_id: rating }))) }}><option value="" disabled>Rate visible students</option>{config?.ratings.map(rating => <option key={rating.id} value={rating.id}>{rating.label}</option>)}</select></div></details>
      <div className="sh-live-grid" aria-busy={saving || loading}>
        {visibleStudents.map(student => {
          const record = records.find(entry => entry.student_id === Number(student.id))
          if (!record || !config) return null
          const age = record.stay_requirement.age ?? student.age ?? null
          const openLeave = latestOpenShachrisLeave(record.leave_intervals)
          const lateMinutes = calculateShachrisMinutesLate(session?.started_at, record.arrival_at)
          const minutesOut = calculateShachrisMinutesOut(record.leave_intervals, clockNow)
          const next = nextShachrisSection(config, record.expectation)
          const resultMilestone = config.stayMilestones.find(milestone => milestone.id === record.requirement_met_milestone)
          const manualUntil = record.stay_requirement.source === 'manual' ? record.stay_requirement.duration === 'today' ? 'Today only' : 'Today and future' : ''
          const recordEvent = (eventType: 'arrival' | 'left' | 'returned', permission?: 'with' | 'without') => session && void runAttendanceAction(() => recordShachrisPresenceEvent({ sessionId: session.id, studentId: record.student_id, eventType, permission, actorName }), eventType === 'left' ? 'Departure recorded.' : eventType === 'returned' ? 'Return recorded.' : 'Arrival recorded.')
          return <article key={student.id} className="sh-live-card">
            <header className="sh-live-card-head"><span className="sh-student-avatar">{String(student.name || '?').split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span><div className="sh-card-name"><strong>{student.name}</strong><span>{age === null ? 'Age not set' : `Age ${age}`}{record.stay_requirement.source === 'unassigned' ? ' · Requirement not set' : ''}</span></div><span className={`sh-presence-badge ${record.presence}`}>{record.presence === 'present' ? 'In Shul' : record.presence === 'left' ? 'Out / Left' : record.presence === 'absent' ? 'Absent' : 'Not Arrived'}</span></header>
            <div className="sh-stay-requirement"><span>Required until</span><strong>{record.stay_requirement.label}</strong>{record.stay_requirement.source === 'manual' && <small>{manualUntil} · Manual</small>}<button className="sh-adjust" disabled={saving || !today} onClick={() => openStayRequirement(student, record)}><SlidersHorizontal size={14} /> Change requirement</button></div>
            <div className="sh-arrival-row"><Clock3 size={15} /><span>Arrived</span><strong>{formatTime(record.arrival_at)}</strong>{lateMinutes !== null && <b className={lateMinutes > 0 ? 'sh-late-pill' : 'sh-present-pill'}>{lateMinutes > 0 ? `${lateMinutes} min late` : 'On time'}</b>}</div>
            {record.presence === 'left' && openLeave && <div className={`sh-current-leave ${openLeave.permission === 'without' ? 'without' : 'with'}`}><LogOut size={15} /><span>Left {formatTime(openLeave.leftAt)}</span><b>{openLeave.permission === 'with' ? 'With permission' : 'Without permission'}</b><strong>{formatMinutes(minutesOut)} total out</strong></div>}
            {record.presence === 'left' && !openLeave && <div className="sh-current-leave unknown"><LogOut size={15} /><span>Currently out</span><b>Departure time / permission not recorded</b><strong>{formatMinutes(minutesOut)} total out</strong></div>}
            {record.last_return_at && <div className="sh-return-row"><RotateCcw size={14} /><span>Last returned</span><strong>{formatTime(record.last_return_at)}</strong><span>Total out {formatMinutes(minutesOut)}</span></div>}
            <div className={`sh-requirement-result ${record.requirement_result}`}>
              {record.requirement_result === 'met' ? <><CircleCheck size={18} /><div><strong>Met Requirement</strong><span>Was In Shul for {resultMilestone?.label || record.requirement_met_milestone} · {formatTime(record.requirement_met_at)}</span></div></> : record.requirement_result === 'not_met' ? <><CircleAlert size={18} /><div><strong>Requirement Not Met</strong><span>Not In Shul at {resultMilestone?.label || record.requirement_met_milestone}</span></div></> : record.stay_requirement.requiredUntil ? <><Clock3 size={18} /><div><strong>{record.presence === 'present' ? 'On Track' : record.presence === 'left' ? 'Out Before Requirement' : 'Waiting for Arrival'}</strong><span>Evaluated automatically at {record.stay_requirement.label}</span></div></> : <><CircleAlert size={18} /><div><strong>Requirement Needs Review</strong><span>Set a manual stay requirement for this age</span></div></>}
            </div>
            <div className="sh-live-actions">
              {record.presence === 'left' ? <button className="sh-button sh-return-button" disabled={locked || !session?.started_at} onClick={() => recordEvent('returned')}><RotateCcw size={16} /> Returned</button> : record.presence !== 'present' ? <button className="sh-button sh-arrive-button" disabled={locked || !session?.started_at} onClick={() => recordEvent('arrival')}><LogIn size={16} /> In Shul / Arrived</button> : <><button className="sh-button sh-leave-permitted" disabled={locked} onClick={() => recordEvent('left', 'with')}><LogOut size={15} /> Left With Permission</button><button className="sh-button sh-leave-unpermitted" disabled={locked} onClick={() => recordEvent('left', 'without')}><LogOut size={15} /> Left Without Permission</button></>}
            </div>
            <details className="sh-progress-card"><summary><CheckCheck size={15} /><span>Davening Progress</span><small>Next: {next?.label || 'Checklist complete'}</small></summary><div className="sh-progress-card-body"><div className="sh-section-checks">{config.sections.map(section => <label key={section.id} className={record.expectation.sectionIds.includes(section.id) ? 'required' : 'extra'}><input type="checkbox" aria-label={`${student.name}: ${section.label}`} checked={record.said_section_ids.includes(section.id)} disabled={locked} onChange={event => void updateRecords([{ ...record, said_section_ids: event.target.checked ? [...record.said_section_ids, section.id] : record.said_section_ids.filter(id => id !== section.id) }])} />{section.label}{!record.expectation.sectionIds.includes(section.id) && <span>extra</span>}</label>)}</div><button disabled={locked || hasMetShachrisExpectation(record)} className="sh-complete" onClick={() => void updateRecords([completeShachrisExpectation(record)])}><Check size={14} />{hasMetShachrisExpectation(record) ? 'Sections complete' : 'Complete required sections'}</button><label className="sh-progress-rating">Rating<select aria-label={`${student.name}: progress rating`} value={record.rating_id} disabled={locked} onChange={event => void updateRecords([{ ...record, rating_id: event.target.value }])}><option value="">Unrated</option>{config.ratings.map(rating => <option key={rating.id} value={rating.id}>{rating.label}</option>)}</select></label><button className="sh-adjust" onClick={() => openExpectation(student, record)} disabled={saving}><SlidersHorizontal size={14} /> Progression history / edit</button></div></details>
          </article>
        })}
        {!loading && !visibleRecords.length && <div className="sh-empty">{error ? 'Session unavailable' : 'No students in this roster'}</div>}
        {loading && <div className="sh-empty">Opening session...</div>}
      </div>
    </>}
    {editingStayStudent && currentStayRecord && config && <div className="sh-drawer-backdrop"><section className="sh-drawer" role="dialog" aria-modal="true" aria-label="Stay requirement override"><header><div><h2>{editingStayStudent.name}</h2><span>Shachris Stay Requirement</span></div><button className="sh-icon" title="Close requirement" aria-label="Close stay requirement" disabled={saving} onClick={() => setEditingStayStudent(null)}><X size={20} /></button></header><div className="sh-drawer-content">{stayHistoryError && <div role="alert" className="sh-error">{stayHistoryError}</div>}<label>Required until<select aria-label="Required until milestone" value={stayRequirementId} disabled={locked || !today} onChange={event => setStayRequirementId(event.target.value)}>{config.stayMilestones.filter(milestone => milestone.id !== 'hodu').map(milestone => <option key={milestone.id} value={milestone.id}>{milestone.label}</option>)}</select></label><fieldset><legend>Apply to</legend><label className="sh-check-label"><input type="radio" name="stay-duration" checked={stayDuration === 'today'} disabled={locked || !today} onChange={() => setStayDuration('today')} />Today only</label><label className="sh-check-label"><input type="radio" name="stay-duration" checked={stayDuration === 'future'} disabled={locked || !today} onChange={() => setStayDuration('future')} />Today and future</label></fieldset><label>Reason / Note<input aria-label="Stay requirement reason" value={stayReason} disabled={locked || !today} onChange={event => setStayReason(event.target.value)} /></label><div className="sh-progression-buttons"><button className="sh-button sh-primary" disabled={locked || !today} onClick={() => void saveStayRequirement('manual')}><Check size={16} /> Save Override</button><button className="sh-button" disabled={locked || !today} onClick={() => void saveStayRequirement('default')}><RefreshCw size={15} /> Use Age Default</button></div><h3>Requirement History</h3>{stayHistoryLoading && <p>Loading...</p>}{!stayHistoryLoading && !stayHistory.length && <p className="sh-muted">No individual stay changes yet</p>}{stayHistory.map(entry => <div className="sh-history-entry" key={entry.id}><strong>{entry.mode === 'default' ? 'Returned to age default' : config.stayMilestones.find(milestone => milestone.id === entry.required_until)?.label || entry.required_until}</strong><span>{entry.effective_date} / {entry.actor_name} / {entry.duration === 'today' ? 'Today only' : 'Today and future'}</span>{entry.reason && <p>{entry.reason}</p>}</div>)}</div></section></div>}
    {editingStudent && config && currentRecord && <div className="sh-drawer-backdrop"><section className="sh-drawer" role="dialog" aria-modal="true" aria-label="Davening Progress"><header><div><h2>{editingStudent.name}</h2><span>Secondary Davening Progress</span></div><button className="sh-icon" title="Close progress" aria-label="Close expectation" disabled={saving} onClick={() => setEditingStudent(null)}><X size={20} /></button></header>
      <div className="sh-drawer-content">{error && <div className="sh-error" role="alert">{error}</div>}<label>Current progress milestone<select aria-label="Current milestone" value={milestoneId} disabled={locked || !today} onChange={event => selectMilestone(event.target.value)}>{config.milestones.map(milestone => <option key={milestone.id} value={milestone.id}>{milestone.label}</option>)}</select></label><div className="sh-progression-buttons"><button className="sh-button" disabled={locked || !today || selectedMilestoneIndex <= 0} onClick={() => selectMilestone(config.milestones[selectedMilestoneIndex - 1].id)}><ArrowDown size={16} /> Lower</button><button className="sh-button" disabled={locked || !today || selectedMilestoneIndex >= config.milestones.length - 1} onClick={() => selectMilestone(config.milestones[selectedMilestoneIndex + 1].id)}><ArrowUp size={16} /> Advance</button></div><fieldset disabled={locked || !today}><legend>Sections required for progress</legend>{config.sections.map(section => <label className="sh-check-label" key={section.id}><input type="checkbox" checked={requiredIds.includes(section.id)} onChange={event => setRequiredIds(previous => event.target.checked ? [...previous, section.id] : previous.filter(id => id !== section.id))} />{section.label}</label>)}</fieldset><label>Reason / Note<input aria-label="Expectation change reason" value={reason} disabled={locked || !today} onChange={event => setReason(event.target.value)} /></label><fieldset disabled={locked || !today}><legend>Apply to</legend><label className="sh-check-label"><input type="radio" name="progress-duration" checked={duration === 'today'} onChange={() => setDuration('today')} />Today only</label><label className="sh-check-label"><input type="radio" name="progress-duration" checked={duration === 'future'} onChange={() => setDuration('future')} />Today and future</label></fieldset><div className="sh-progression-buttons"><button className="sh-button sh-primary" disabled={locked || !today || !requiredIds.length} onClick={() => void changeExpectation('manual')}><Check size={16} /> Save Progress Override</button><button className="sh-button" disabled={locked || !today} onClick={() => void changeExpectation('default')}><RefreshCw size={15} /> Use Progress Default</button></div>
      <h3>Progression History</h3>{historyLoading && <p>Loading...</p>}{historyError && <div role="alert" className="sh-error">{historyError}</div>}{!historyLoading && !historyError && !history.length && <p className="sh-muted">No progress changes yet</p>}{history.map(entry => <div className="sh-history-entry" key={entry.id}><strong>{entry.mode === 'default' ? 'Returned to progress default' : config.milestones.find(milestone => milestone.id === entry.milestone_id)?.label || entry.milestone_id}</strong><span>{entry.effective_date} / {entry.actor_name} / {entry.duration === 'today' ? 'Today only' : 'Today and future'}</span>{entry.reason && <p>{entry.reason}</p>}{entry.section_ids && <span>{entry.section_ids.map(id => config.sections.find(section => section.id === id)?.label || id).join(' / ')}</span>}</div>)}</div>
    </section></div>}
  </div>
}