import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowDown, ArrowUp, Check, CheckCheck, ChevronRight, Settings2, SlidersHorizontal, Users, X, RefreshCw } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { loadShachrisProgression, loadShachrisSettings, openShachrisSession, saveShachrisExpectation, saveShachrisRecords, type ShachrisSession, type ShachrisSettings } from '../services/shachrisService'
import { calculateAge, completePresentShachrisRequirements, completeShachrisExpectation, hasMetShachrisExpectation, localDateKey, nextShachrisSection, type ShachrisAssignment, type ShachrisRecord } from '../utils/shachris'
import { isLeadershipRole } from '../utils/permissions'
import ShachrisSettingsEditor from './ShachrisSettingsEditor'
import './ShachrisWorkspace.css'

type Student = { id: number | string; name?: string; is_active?: boolean; date_of_birth?: unknown; grade?: unknown }
type Props = {
  students: Student[]
  classes: Array<{ id: number | string; name: string }>
  primaryClassIdsByStudent: Record<string | number, string>
  instructionalGroups: Array<{ id: string; name?: string; status?: string }>
  instructionalGroupMemberships: Array<{ group_id: string; student_id: number }>
  actorName: string
  role: string
  onClose: () => void
}

function errorMessage(caught: unknown): string {
  if (caught && typeof caught === 'object' && 'message' in caught) return String(caught.message)
  return 'Could not save. Reload and try again.'
}

export default function ShachrisWorkspace({ students, classes, primaryClassIdsByStudent, instructionalGroups, instructionalGroupMemberships, actorName, role, onClose }: Props) {
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
    let canceled = false
    void (async () => {
      try {
        const [loadedSettings, permissions] = await Promise.all([loadShachrisSettings(), supabase.rpc('dashboard_current_permissions')])
        if (permissions.error) throw permissions.error
        const permissionRank = ['none', 'view', 'add', 'edit', 'delete']
        const editable = permissionRank.indexOf(String(permissions.data?.attendance)) >= 3
        const manageable = isLeadershipRole(role) && permissionRank.indexOf(String(permissions.data?.setup)) >= 3
        const opened = await openShachrisSession(date, studentIdsKey ? studentIdsKey.split(',').map(Number) : [])
        if (canceled) return
        setSettings(loadedSettings)
        setCanEdit(editable)
        setCanManage(manageable)
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
  }, [date, studentIdsKey, reload, role])

  useEffect(() => {
    if (!editingStudent) return
    let canceled = false
    void loadShachrisProgression(Number(editingStudent.id)).then(rows => { if (!canceled) setHistory(rows) }).catch(caught => { if (!canceled) setHistoryError(errorMessage(caught)) }).finally(() => { if (!canceled) setHistoryLoading(false) })
    return () => { canceled = true }
  }, [editingStudent])

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
  const config = session?.config
  const selectedMilestoneIndex = config?.milestones.findIndex(milestone => milestone.id === milestoneId) ?? -1
  function selectMilestone(id: string) {
    setMilestoneId(id)
    setRequiredIds([...(config?.milestones.find(milestone => milestone.id === id)?.sectionIds || [])])
  }

  return <div className="shachris">
    <header className="shachris-heading">
      <div><button className="sh-back" disabled={saving} onClick={onClose}><ArrowLeft size={16} /> School Day</button><h1>Shachris</h1><span className="sh-subtitle">{view === 'live' ? 'Live Session' : 'Rules & Settings'}</span></div>
      <div className="sh-heading-actions"><span role="status" className="sh-save-status">{loading ? 'Loading...' : saving ? 'Saving...' : status || (canEdit ? 'Ready' : 'View only')}</span><button className="sh-icon" title="Reload saved session" aria-label="Reload saved session" disabled={saving || loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={18} /></button><button className={view === 'settings' ? 'sh-button active' : 'sh-button'} disabled={saving || loading || !settings} onClick={() => setView(view === 'settings' ? 'live' : 'settings')}>{view === 'settings' ? <Users size={17} /> : <Settings2 size={17} />}{view === 'settings' ? 'Live Session' : 'Rules & Settings'}</button></div>
    </header>
    {error && <div className="sh-error" role="alert">{error}</div>}
    {view === 'settings' && settings ? <ShachrisSettingsEditor key={settings.revision} settings={settings} canEdit={canManage} onSaved={saved => { setSettings(saved); setStatus('Settings saved. Existing sessions remain unchanged.') }} /> : <>
      <div className="sh-filters"><label>Date<input type="date" aria-label="Session date" value={date} max={localDateKey()} disabled={saving || loading} onChange={event => { if (event.target.value) { setDate(event.target.value); setEditingStudent(null) } }} /></label><label>Class / Group<select aria-label="Class or group" value={scope} disabled={saving} onChange={event => setScope(event.target.value)}><option value="all">Entire roster</option>{classes.map(entry => <option key={entry.id} value={`class:${entry.id}`}>{entry.name}</option>)}{instructionalGroups.filter(group => group.status !== 'archived').map(group => <option key={group.id} value={`group:${group.id}`}>{group.name || group.id}</option>)}</select></label><label className="sh-search">Student<input type="search" aria-label="Find student" placeholder="Search name" value={search} disabled={saving} onChange={event => setSearch(event.target.value)} /></label></div>
      <div className="sh-summary"><span><Users size={16} /><strong>{visibleRecords.length}</strong> students</span><span><strong>{visibleRecords.filter(record => record.presence === 'present').length}</strong> in shul</span><span><strong>{visibleRecords.filter(hasMetShachrisExpectation).length}</strong> requirements met</span><span><strong>{visibleRecords.filter(record => record.presence === 'unmarked').length}</strong> presence unmarked</span></div>
      <div className="sh-bulk"><strong>{visibleRecords.length} visible students</strong><button className="sh-button" disabled={locked || !visibleRecords.length} onClick={() => void updateRecords(visibleRecords.filter(record => record.presence !== 'present').map(record => ({ ...record, presence: 'present' })))}><Users size={16} /> All In Shul</button><button className="sh-button sh-primary" title="Complete requirements for visible students currently In Shul only" disabled={locked || !presentRequirements.length} onClick={() => void updateRecords(presentRequirements)}><CheckCheck size={17} /> Complete Present Requirements</button><select aria-label="Set rating for visible students" disabled={locked || !visibleRecords.length} value="" onChange={event => { const rating = event.target.value; void updateRecords(visibleRecords.map(record => ({ ...record, rating_id: rating }))) }}><option value="" disabled>Rate visible students</option>{config?.ratings.map(rating => <option key={rating.id} value={rating.id}>{rating.label}</option>)}</select></div>
      <div className="sh-roster" aria-busy={saving || loading}>
        <div className="sh-column-head"><span>Student / Expectation</span><span>Presence</span><span>Sections Said</span><span>Rating</span></div>
        {visibleStudents.map(student => {
          const record = records.find(entry => entry.student_id === Number(student.id))
          if (!record || !config) return null
          const next = nextShachrisSection(config, record.expectation)
          const age = calculateAge(typeof student.date_of_birth === 'string' ? student.date_of_birth : null, date)
          return <article key={student.id} className="sh-student-row">
            <div className="sh-student"><div className="sh-student-name">{student.name}<span>{age === null ? 'Age not set' : `Age ${age}`}</span></div><div className="sh-expectation"><strong>Current:</strong> {record.expectation.label}{record.expectation.source === 'manual' && <span className="sh-manual">Manual</span>}{record.expectation.duration === 'today' && <span className="sh-manual">Today only</span>}</div><div className="sh-required">{config.sections.filter(section => record.expectation.sectionIds.includes(section.id)).map(section => section.label).join(' / ')}</div><div className="sh-next"><ChevronRight size={13} />Next: {next?.label || 'Full expectation'}</div><button className="sh-adjust" title={`Change ${student.name}'s expectation`} onClick={() => openExpectation(student, record)} disabled={saving}><SlidersHorizontal size={14} /> Expectation / History</button></div>
            <div className="sh-presence"><span className="sh-mobile-label">Presence</span><div className="sh-segments">{([['present', 'In Shul'], ['absent', 'Absent'], ['left', 'Left']] as const).map(([value, label]) => <button key={value} title={label} disabled={locked} aria-pressed={record.presence === value} className={record.presence === value ? `selected ${value}` : ''} onClick={() => void updateRecords([{ ...record, presence: record.presence === value ? 'unmarked' : value }])}>{label}</button>)}</div>{record.presence === 'unmarked' && <span className="sh-muted">Unmarked</span>}</div>
            <div className="sh-sections"><span className="sh-mobile-label">Sections Said</span><div className="sh-section-checks">{config.sections.map(section => <label key={section.id} className={record.expectation.sectionIds.includes(section.id) ? 'required' : 'extra'}><input type="checkbox" aria-label={`${student.name}: ${section.label}`} checked={record.said_section_ids.includes(section.id)} disabled={locked} onChange={event => void updateRecords([{ ...record, said_section_ids: event.target.checked ? [...record.said_section_ids, section.id] : record.said_section_ids.filter(id => id !== section.id) }])} />{section.label}{!record.expectation.sectionIds.includes(section.id) && <span>extra</span>}</label>)}</div><button disabled={locked || hasMetShachrisExpectation(record)} className={hasMetShachrisExpectation(record) ? 'sh-met' : 'sh-complete'} onClick={() => void updateRecords([completeShachrisExpectation(record)])}><Check size={14} />{hasMetShachrisExpectation(record) ? 'Requirement met' : 'Complete requirement'}</button></div>
            <div className="sh-rating"><label><span className="sh-mobile-label">Rating</span><select aria-label={`${student.name}: rating`} value={record.rating_id} disabled={locked} onChange={event => void updateRecords([{ ...record, rating_id: event.target.value }])}><option value="">Unrated</option>{config.ratings.map(rating => <option key={rating.id} value={rating.id}>{rating.label}</option>)}</select></label></div>
          </article>
        })}
        {!loading && !visibleRecords.length && <div className="sh-empty">{error ? 'Session unavailable' : 'No students in this roster'}</div>}
        {loading && <div className="sh-empty">Opening session...</div>}
      </div>
    </>}
    {editingStudent && config && currentRecord && <div className="sh-drawer-backdrop"><section className="sh-drawer" role="dialog" aria-modal="true" aria-label="Individual expectation" onKeyDown={event => { if (event.key === 'Escape' && !saving) setEditingStudent(null) }}><header><div><h2>{editingStudent.name}</h2><span>Individual Expectation</span></div><button className="sh-icon" title="Close expectation" aria-label="Close expectation" disabled={saving} onClick={() => setEditingStudent(null)}><X size={20} /></button></header>
      <fieldset className="sh-duration-choice" disabled={locked || !today}><legend>Apply To</legend><label className="sh-check-label"><input type="radio" name="expectation-duration" value="today" checked={duration === 'today'} onChange={() => setDuration('today')} />Today only</label><label className="sh-check-label"><input type="radio" name="expectation-duration" value="future" checked={duration === 'future'} onChange={() => setDuration('future')} />Today and future</label></fieldset>
      <div className="sh-drawer-content">{error && <div className="sh-error" role="alert">{error}</div>}<label>Current milestone<select aria-label="Current milestone" value={milestoneId} disabled={locked || !today} onChange={event => selectMilestone(event.target.value)}>{config.milestones.map(milestone => <option key={milestone.id} value={milestone.id}>{milestone.label}</option>)}</select></label><div className="sh-progression-buttons"><button className="sh-button" disabled={locked || !today || selectedMilestoneIndex <= 0} onClick={() => selectMilestone(config.milestones[selectedMilestoneIndex - 1].id)}><ArrowDown size={16} /> Lower</button><button className="sh-button" disabled={locked || !today || selectedMilestoneIndex >= config.milestones.length - 1} onClick={() => selectMilestone(config.milestones[selectedMilestoneIndex + 1].id)}><ArrowUp size={16} /> Advance</button></div><fieldset disabled={locked || !today}><legend>Responsible To Say</legend>{config.sections.map(section => <label className="sh-check-label" key={section.id}><input type="checkbox" checked={requiredIds.includes(section.id)} onChange={event => setRequiredIds(previous => event.target.checked ? [...previous, section.id] : previous.filter(id => id !== section.id))} />{section.label}</label>)}</fieldset><label>Reason / Note<input aria-label="Expectation change reason" value={reason} disabled={locked || !today} onChange={event => setReason(event.target.value)} /></label><div className="sh-progression-buttons"><button className="sh-button sh-primary" disabled={locked || !today || !requiredIds.length} onClick={() => void changeExpectation('manual')}><Check size={16} /> Save Override</button><button className="sh-button" disabled={locked || !today} onClick={() => void changeExpectation('default')}><RefreshCw size={15} /> Use Default</button></div>{!today && <p className="sh-muted">Historical expectation</p>}
      <h3>Progression History</h3>{historyLoading && <p>Loading...</p>}{historyError && <div role="alert" className="sh-error">{historyError}</div>}{!historyLoading && !historyError && !history.length && <p className="sh-muted">No individual changes yet</p>}{history.map(entry => <div className="sh-history-entry" key={entry.id}><strong>{entry.mode === 'default' ? 'Returned to default' : config.milestones.find(milestone => milestone.id === entry.milestone_id)?.label || entry.milestone_id}</strong><span>{entry.effective_date} / {entry.actor_name} / {entry.duration === 'today' ? 'Today only' : 'Today and future'}</span>{entry.reason && <p>{entry.reason}</p>}{entry.section_ids && <span>{entry.section_ids.map(id => config.sections.find(section => section.id === id)?.label || id).join(' / ')}</span>}</div>)}</div>
    </section></div>}
  </div>
}