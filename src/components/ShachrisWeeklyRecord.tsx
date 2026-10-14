import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Pencil, Save, RefreshCw, RotateCcw, X } from 'lucide-react'
import type { ShachrisDayAudit, ShachrisHistory, ShachrisSettings } from '../services/shachrisService'
import type { ShachrisBackend } from '../services/shachrisBackend'
import { calculateShachrisMinutesLate, calculateShachrisMinutesOut, DEFAULT_SHACHRIS_WEEKLY_RULES, isShachrisLate, localDateKey, shachrisDayResult, shachrisDayTone, shachrisGraceMinutes, shachrisPresenceLabel, shachrisWeekDates, shachrisWeeklyEligibility, shachrisWeeklyJudgment } from '../utils/shachris'
import type { ShachrisHistoricalResult, ShachrisWeeklyDecision } from '../utils/shachris'

type Props = {
  loadHistory: NonNullable<ShachrisBackend['loadShachrisHistory']>
  saveDay?: ShachrisBackend['saveShachrisHistoricalDay']
  loadAudit?: ShachrisBackend['loadShachrisDayAudit']
  loadDecisions?: ShachrisBackend['loadShachrisWeeklyDecisions']
  saveDecision?: ShachrisBackend['saveShachrisWeeklyDecision']
  canEdit: boolean
  actorName: string
  settings: ShachrisSettings
  students: Array<{ id: number | string; name?: string }>
}

function time(value: string | null | undefined) {
  return value ? new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not recorded'
}

export default function ShachrisWeeklyRecord({ loadHistory, saveDay, loadAudit, loadDecisions, saveDecision, canEdit, actorName, settings, students }: Props) {
  const [offset, setOffset] = useState(0)
  const [reload, setReload] = useState(0)
  const [history, setHistory] = useState<ShachrisHistory>({ sessions: [], records: [] })
  const [resolved, setResolved] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<{ studentId: number; date: string } | null>(null)
  const [draft, setDraft] = useState<ShachrisHistoricalResult | null>(null)
  const [editReason, setEditReason] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const [audit, setAudit] = useState<ShachrisDayAudit[]>([])
  const [auditResolved, setAuditResolved] = useState('')
  const [auditError, setAuditError] = useState('')
  const [decisions, setDecisions] = useState<ShachrisWeeklyDecision[]>([])
  const [decisionStudent, setDecisionStudent] = useState<number | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [decisionError, setDecisionError] = useState('')
  const dates = shachrisWeekDates(localDateKey(), offset)
  const studentIdsKey = students.map(student => Number(student.id)).filter(Number.isFinite).sort((left, right) => left - right).join(',')
  const from = dates[0]
  const through = dates[5]
  const requestKey = `${from}:${studentIdsKey}:${reload}`
  const loading = resolved !== requestKey
  const rules = settings.config.weeklyEligibility || DEFAULT_SHACHRIS_WEEKLY_RULES

  useEffect(() => {
    let canceled = false
    const studentIds = studentIdsKey ? studentIdsKey.split(',').map(Number) : []
    void Promise.all([loadHistory(from, through, studentIds), loadDecisions ? loadDecisions(from, studentIds) : Promise.resolve([])]).then(([data, savedDecisions]) => {
      if (!canceled) { setHistory(data); setDecisions(savedDecisions); setError('') }
    }).catch(caught => {
      if (!canceled) {
        setHistory({ sessions: [], records: [] })
        setError(caught && typeof caught === 'object' && 'message' in caught ? String(caught.message) : 'Could not load saved history.')
      }
    }).finally(() => { if (!canceled) setResolved(requestKey) })
    return () => { canceled = true }
  }, [from, through, studentIdsKey, reload, requestKey, loadHistory, loadDecisions])

  function day(studentId: number, date: string) {
    const session = history.sessions.find(entry => entry.session_date === date && !entry.voided_at)
    return { session, record: history.records.find(entry => entry.session_id === session?.id && entry.student_id === studentId) }
  }

  const studentDecisions = decisions.filter(entry => entry.student_id === decisionStudent && entry.week_start === from)
  const decisionDays = decisionStudent === null ? [] : dates.map(date => day(decisionStudent, date))
  const decisionJudgment = shachrisWeeklyJudgment(shachrisWeeklyEligibility(decisionDays, rules), decisionDays.map(({ session, record }, index) => shachrisDayTone(dates[index], session, record)), studentDecisions[0])

  async function decide(decision: ShachrisWeeklyDecision['decision']) {
    if (!saveDecision || !canEdit || saving || loading || error || decisionStudent === null || !decisionReason.trim()) return
    if (decision !== 'clear' && decisionJudgment.automaticTone !== 'amber') return
    setSaving(true)
    setDecisionError('')
    try {
      const saved = await saveDecision({ weekStart: from, studentId: decisionStudent, decision, expectedId: studentDecisions[0]?.id ?? null, reason: decisionReason, actorName })
      setDecisions(previous => [saved, ...previous])
      setDecisionReason('')
    } catch (caught) {
      setDecisionError(caught && typeof caught === 'object' && 'message' in caught ? String(caught.message) : 'Could not save decision. Reload before trying again.')
    } finally { setSaving(false) }
  }

  const detail = selected && !loading && !error ? day(selected.studentId, selected.date) : null
  const detailRecord = detail?.record
  const detailSession = detail?.session
  const end = detailSession?.milestone_times['live-session-ended']
  const hasOpenLeave = detailRecord?.leave_intervals.some(interval => !interval.returnedAt)
  const minutesOut = detailRecord ? calculateShachrisMinutesOut(detailRecord.leave_intervals.filter(interval => interval.returnedAt || end && interval.leftAt < end), end ? Date.parse(end) : 0, end ? Date.parse(end) : Infinity) : 0
  const unknownOpenDuration = detailRecord?.leave_intervals.some(interval => !interval.returnedAt && (!end || interval.leftAt >= end))
  const lateMinutes = detailRecord?.late_minutes ?? calculateShachrisMinutesLate(detailSession?.started_at, detailRecord?.arrival_at, shachrisGraceMinutes(detailSession?.config))
  const originalLate = isShachrisLate(detailSession?.started_at, detailRecord?.arrival_at, shachrisGraceMinutes(detailSession?.config))
  const auditKey = `${detailSession?.id || ''}:${selected?.studentId || ''}:${detailRecord?.revision ?? ''}`
  const auditSessionId = detailSession?.id
  const auditStudentId = selected?.studentId

  useEffect(() => {
    if (!auditSessionId || !auditStudentId || !loadAudit) return
    let canceled = false
    void loadAudit(auditSessionId, auditStudentId).then(rows => { if (!canceled) { setAudit(rows); setAuditError('') } })
      .catch(caught => { if (!canceled) setAuditError(caught && typeof caught === 'object' && 'message' in caught ? String(caught.message) : 'Could not load edit audit.') })
      .finally(() => { if (!canceled) setAuditResolved(auditKey) })
    return () => { canceled = true }
  }, [auditSessionId, auditStudentId, auditKey, loadAudit])

  function openDay(studentId: number, date: string) {
    setSelected({ studentId, date })
    setDraft(null)
    setEditError('')
  }

  function editDay() {
    if (!selected || !canEdit || !saveDay || selected.date >= localDateKey()) return
    const result = shachrisDayResult(detailSession, detailRecord)
    setDraft(detailRecord?.historical_result ? structuredClone(detailRecord.historical_result) : {
      status: result.absence ? detailRecord?.absence_status || 'absent' : 'present',
      onTime: result.onTime, stayedRequired: result.entireStay,
      lateReason: detailRecord?.late_reason || 'no_reason', lateExcused: detailRecord?.late_excused || false,
      lateReasonNote: detailRecord?.late_reason_note || '', note: detailRecord?.note || '',
    })
    setEditReason('')
    setEditError('')
  }

  async function saveEdit() {
    if (!selected || !draft || !saveDay || !canEdit || saving) return
    if (!editReason.trim()) { setEditError('Enter a reason for this entry or correction.'); return }
    if (draft.status === 'present' && (draft.onTime === null || draft.stayedRequired === null)) { setEditError('Choose arrival and required-stay results.'); return }
    setSaving(true)
    setEditError('')
    const result = draft.status !== 'present' ? { ...draft, onTime: null, stayedRequired: null, lateExcused: false, lateReason: 'no_reason' as const, lateReasonNote: '' }
      : draft.onTime ? { ...draft, lateExcused: false, lateReason: 'no_reason' as const, lateReasonNote: '' } : draft
    try {
      const saved = await saveDay({ date: selected.date, studentId: selected.studentId, result, revision: detailRecord?.revision ?? null, reason: editReason, actorName })
      setHistory(previous => ({ sessions: [...previous.sessions.filter(entry => entry.id !== saved.session.id), saved.session], records: [...previous.records.filter(entry => entry.session_id !== saved.record.session_id || entry.student_id !== saved.record.student_id), saved.record] }))
      setDraft(null)
    } catch (caught) {
      setEditError(caught && typeof caught === 'object' && 'message' in caught ? String(caught.message) : 'Could not save historical day.')
    } finally { setSaving(false) }
  }

  function auditSummary(record: ShachrisDayAudit['detail']['before']) {
    const result = record?.historical_result
    if (!record) return 'No student record'
    return result ? `${result.status} / ${result.onTime === null ? 'No arrival result' : result.onTime ? 'On Time' : 'Late'} / ${result.stayedRequired === null ? 'No stay result' : result.stayedRequired ? 'Stayed Required Time' : 'Did Not Stay Required Time'} / ${result.lateReason}${result.lateExcused ? ' (excused)' : ''} / ${result.lateReasonNote} / ${result.note}`
      : `Recorded facts: ${shachrisPresenceLabel(record)} / arrival ${time(record.arrival_at)} / stay ${record.requirement_result} / ${record.late_reason || 'no late reason'}${record.late_excused ? ' (excused)' : ''} / ${record.late_reason_note || ''} / ${record.note}`
  }

  return <section className="sh-weekly" aria-label="Weekly Record">
    <div className="sh-week-controls" inert={saving}>
      <button className="sh-icon" title="Previous week" aria-label="Previous week" onClick={() => { setOffset(value => value - 1); setSelected(null) }}><ChevronLeft size={18} /></button>
      <strong>{from} to {through}</strong>
      <button className="sh-icon" title="Next week" aria-label="Next week" disabled={offset >= 0} onClick={() => { setOffset(value => value + 1); setSelected(null) }}><ChevronRight size={18} /></button>
      <button className={`sh-button ${offset === 0 ? 'active' : ''}`} onClick={() => { setOffset(0); setSelected(null) }}>This Week</button>
      <button className={`sh-button ${offset === -1 ? 'active' : ''}`} onClick={() => { setOffset(-1); setSelected(null) }}>Last Week</button>
      <button className="sh-icon" title="Reload saved history" aria-label="Reload saved history" disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={18} /></button>
    </div>
    {error && <div role="alert" className="sh-error">{error}</div>}
    {loading ? <p role="status">Loading saved history...</p> : !error && <div className="sh-week-table-scroll"><table className="sh-week-table">
      <thead><tr><th scope="col">Student</th>{dates.map(date => <th scope="col" key={date}>{new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' })}</th>)}<th scope="col">Eligible for Treat Next Week{offset === 0 && <small>Provisional</small>}</th></tr></thead>
      <tbody>{students.map(student => {
        const days = dates.map(date => day(Number(student.id), date))
        const eligibility = shachrisWeeklyEligibility(days, rules)
        const dayStates = days.map(({ session, record }, index) => {
          const result = shachrisDayResult(session, record)
          const lateExcused = record?.historical_result?.lateExcused ?? record?.late_excused
          const tone = shachrisDayTone(dates[index], session, record)
          return { session, record, result, lateExcused, tone }
        })
        const latestDecision = decisions.find(entry => entry.student_id === Number(student.id) && entry.week_start === from)
        const judgment = shachrisWeeklyJudgment(eligibility, dayStates.map(day => day.tone), latestDecision)
        const resultTone = judgment.tone
        const pending = resultTone === 'pending'
        return <tr key={student.id}><th scope="row">{student.name}</th>{dayStates.map(({ session, record, result, lateExcused, tone }, index) => {
          const arrival = result.absence && record ? record.historical_result ? { absent: 'Absent', excused: 'Excused from Shul', not_in_shul: 'Not in Shul', present: 'In Shul' }[record.historical_result.status] : shachrisPresenceLabel(record) : result.onTime === null ? 'Not recorded' : result.onTime ? 'On Time' : 'Late'
          const stay = result.entireStay === null ? 'Stay not confirmed' : result.entireStay ? 'Stayed Entire Time' : 'Did Not Stay Entire Time'
          const cellClass = `sh-week-day sh-week-${tone}`
          return <td className="sh-week-day-cell" key={dates[index]}>{session || dates[index] < localDateKey() ? <button className={cellClass} disabled={saving} aria-label={`${student.name}: ${dates[index]}`} onClick={() => openDay(Number(student.id), dates[index])}>
            {!session ? <span>No saved session</span> : !result.required ? <span>Not started</span> : !record ? <span>No student record</span> : <><span className={result.onTime === true ? 'sh-week-pass' : ''}>{arrival}{result.onTime === false && lateExcused && <small>Excused</small>}</span><span className={result.entireStay === true ? 'sh-week-pass' : ''}>{stay}</span></>}
          </button> : <div className={cellClass}><span className="sh-muted">{dates[index] > localDateKey() ? 'Upcoming' : 'No saved session'}</span></div>}</td>
        })}<td className={`sh-week-result sh-week-result-${resultTone}`}><strong className={resultTone === 'eligible' ? 'sh-week-pass' : ''}>{pending ? 'Pending' : resultTone === 'amber' ? 'Review' : resultTone === 'eligible' ? 'YES / Eligible' : 'Not Eligible'}</strong><small>{pending ? 'Week incomplete / pending' : <>{resultTone === 'amber' && <>Needs your decision<br /></>}{eligibility.exceptions} exception day{eligibility.exceptions === 1 ? '' : 's'} / {eligibility.requiredDays} required</>}</small>{judgment.manual && <small>Manual decision: {judgment.manual.actor_name}</small>}{loadDecisions && (judgment.automaticTone === 'amber' || latestDecision) && <button className="sh-button" disabled={saving} aria-label={`${student.name}: Eligibility decision`} onClick={() => { setDecisionStudent(Number(student.id)); setDecisionReason(''); setDecisionError('') }}><Pencil size={14} />{canEdit && saveDecision ? 'Decision' : 'Decision History'}</button>}</td></tr>
      })}</tbody>
    </table>{!students.length && <p className="sh-empty">No active students in this roster</p>}</div>}
    {decisionStudent !== null && !loading && !error && <div className="sh-drawer-backdrop"><section className="sh-drawer" role="dialog" aria-modal="true" aria-label="Weekly eligibility decision"><header><div><h2>{students.find(student => Number(student.id) === decisionStudent)?.name}</h2><span>{from} to {through}</span></div><button className="sh-icon" title="Close eligibility decision" aria-label="Close eligibility decision" disabled={saving} onClick={() => setDecisionStudent(null)}><X size={20} /></button></header><div className="sh-drawer-content">
      <h3>Final Eligibility Decision</h3>
      {decisionError && <p role="alert" className="sh-error">{decisionError}</p>}
      {canEdit && saveDecision && (decisionJudgment.automaticTone === 'amber' || studentDecisions[0]?.decision !== 'clear' && studentDecisions.length > 0) && <>
        <label>Decision reason<input aria-label="Eligibility decision reason" maxLength={500} disabled={saving} value={decisionReason} onChange={event => setDecisionReason(event.target.value)} /></label>
        <div className="sh-progression-buttons"><button className="sh-button sh-primary" disabled={saving || !decisionReason.trim() || decisionJudgment.automaticTone !== 'amber'} onClick={() => void decide('eligible')}><Check size={16} /> Count as Eligible</button><button className="sh-button" disabled={saving || !decisionReason.trim() || decisionJudgment.automaticTone !== 'amber'} onClick={() => void decide('not_eligible')}><X size={16} /> Count as Not Eligible</button>{studentDecisions[0] && studentDecisions[0].decision !== 'clear' && <button className="sh-button" disabled={saving || !decisionReason.trim()} onClick={() => void decide('clear')}><RotateCcw size={16} /> Clear Manual Decision</button>}</div>
      </>}
      <h3>Decision History</h3>{!studentDecisions.length ? <p className="sh-muted">No manual decisions recorded</p> : studentDecisions.map(entry => <div className="sh-history-entry" key={entry.id}><strong>{entry.decision === 'clear' ? 'Manual decision cleared' : entry.decision === 'eligible' ? 'Count as Eligible' : 'Count as Not Eligible'}</strong><span>{entry.actor_name} / {new Date(entry.created_at).toLocaleString()}</span><p>{entry.reason}</p></div>)}
    </div></section></div>}
    {selected && detail && <div className="sh-drawer-backdrop"><section className="sh-drawer" role="dialog" aria-modal="true" aria-label="Saved Shachris day" onKeyDown={event => { if (event.key === 'Escape' && !saving) { setDraft(null); setSelected(null) } }}><header><div><h2>{students.find(student => Number(student.id) === selected.studentId)?.name}</h2><span>{selected.date}</span></div><button autoFocus disabled={saving} className="sh-icon" title="Close day details" aria-label="Close day details" onClick={() => { setDraft(null); setSelected(null) }}><X size={20} /></button></header><div className="sh-drawer-content">
      {draft ? <form className="sh-day-edit" onSubmit={event => { event.preventDefault(); void saveEdit() }}>
        {editError && <div role="alert" className="sh-error">{editError}</div>}
        <fieldset disabled={saving}><legend>Edit Day</legend>
          <label>Status<select aria-label="Historical attendance status" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as ShachrisHistoricalResult['status'] })}><option value="present">Attended</option><option value="absent">Absent</option><option value="excused">Excused from Shul</option><option value="not_in_shul">Not in Shul</option></select></label>
          {draft.status === 'present' && <>
            <label>Arrival result<select aria-label="Historical arrival result" value={draft.onTime === null ? '' : String(draft.onTime)} onChange={event => setDraft({ ...draft, onTime: event.target.value === '' ? null : event.target.value === 'true' })}><option value="">Choose result</option><option value="true">On Time</option><option value="false">Late</option></select></label>
            {draft.onTime === false && <><label>Late reason<select aria-label="Historical late reason" value={draft.lateReason} onChange={event => { const lateReason = event.target.value as ShachrisHistoricalResult['lateReason']; setDraft({ ...draft, lateReason, lateExcused: lateReason === 'excused' || lateReason !== 'no_reason' && draft.lateExcused }) }}><option value="transportation">Transportation</option><option value="excused">Excused</option><option value="no_reason">No Reason</option><option value="other">Other</option></select></label><label>Reason note<input aria-label="Historical late reason note" maxLength={500} value={draft.lateReasonNote} onChange={event => setDraft({ ...draft, lateReasonNote: event.target.value })} /></label><label className="sh-check-label"><input type="checkbox" aria-label="Historical late excused" disabled={draft.lateReason === 'excused' || draft.lateReason === 'no_reason'} checked={draft.lateExcused} onChange={event => setDraft({ ...draft, lateExcused: event.target.checked })} />Excused lateness</label></>}
            <label>Required stay<select aria-label="Historical required stay" value={draft.stayedRequired === null ? '' : String(draft.stayedRequired)} onChange={event => setDraft({ ...draft, stayedRequired: event.target.value === '' ? null : event.target.value === 'true' })}><option value="">Choose result</option><option value="true">Stayed Required Time</option><option value="false">Did Not Stay Required Time</option></select></label>
          </>}
          <label>Note<textarea aria-label="Historical day note" maxLength={2000} value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })} /></label>
          <label>Entry / correction reason<input aria-label="Historical edit reason" required maxLength={500} value={editReason} onChange={event => setEditReason(event.target.value)} /></label>
        </fieldset><div className="sh-progression-buttons"><button className="sh-button sh-primary" type="submit" disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save Day'}</button><button className="sh-button" type="button" disabled={saving} onClick={() => { setDraft(null); setEditError('') }}>Cancel</button></div>
      </form> : <>
        {canEdit && saveDay && selected.date < localDateKey() && <button className="sh-button" onClick={editDay}><Pencil size={16} /> Edit Day</button>}
        {detailRecord?.historical_result && <div className="sh-history-entry"><strong>Entered / corrected result</strong><span>{auditSummary(detailRecord)}</span></div>}
      {!detailRecord ? <p>No student record saved.</p> : <>
        {detailRecord.historical_result && <h3>Original Recorded Facts</h3>}
        <dl className="sh-week-facts"><dt>Status</dt><dd>{shachrisPresenceLabel(detailRecord)}</dd><dt>Arrival time</dt><dd>{time(detailRecord.arrival_at)}</dd><dt>Minutes late</dt><dd>{lateMinutes === null ? 'Not recorded' : lateMinutes === 0 && originalLate ? '<1' : lateMinutes}</dd><dt>Late reason</dt><dd>{detailRecord.late_reason?.replaceAll('_', ' ') || 'Not recorded'}{detailRecord.late_reason_note && `: ${detailRecord.late_reason_note}`}</dd><dt>Excused lateness</dt><dd>{detailRecord.late_excused ? 'Yes' : 'No'}</dd><dt>Note</dt><dd>{detailRecord.note || 'None'}</dd><dt>Required until</dt><dd>{detailRecord.stay_requirement.label}</dd><dt>Saved stay result</dt><dd>{detailRecord.requirement_result.replaceAll('_', ' ')}</dd><dt>Personal clearance</dt><dd>{time(detailRecord.personally_cleared_at)}</dd><dt>Live session ended</dt><dd>{time(end)}</dd><dt>Total time out</dt><dd>{minutesOut} min{unknownOpenDuration ? ' known time only; open duration unknown' : hasOpenLeave ? ' through session end; no return recorded' : ''}</dd></dl>
        <h3>Leave / Return History</h3>{!detailRecord.leave_intervals.length ? <p className="sh-muted">No departures recorded</p> : detailRecord.leave_intervals.map((interval, index) => <div className="sh-history-entry" key={index}><strong>Left {time(interval.leftAt)}</strong><span>{interval.permission === 'with' ? 'With permission' : 'Without permission'}</span><span>{interval.returnedAt ? `Returned ${time(interval.returnedAt)}` : 'No return recorded'}</span></div>)}
      </>}
      </>}
      {loadAudit && detailSession && <><h3>Edit Audit</h3>{auditResolved !== auditKey ? <p>Loading edit audit...</p> : auditError ? <p role="alert">{auditError}</p> : !audit.length ? <p className="sh-muted">No historical edits</p> : audit.map(entry => <div className="sh-history-entry" key={entry.id}><strong>{entry.detail.action === 'undo-arrival' && 'Undo Arrival / '}{entry.actor_name} / {new Date(entry.created_at).toLocaleString()}</strong><p>{entry.detail.reason}</p><span>Before: {auditSummary(entry.detail.before)}</span><span>After: {auditSummary(entry.detail.after)}</span></div>)}</>}
    </div></section></div>}
  </section>
}