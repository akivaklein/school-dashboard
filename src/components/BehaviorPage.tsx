import { useState } from 'react'
import playSound from '../utils/playSound'
import { studentBelongsToClass } from './dashboardData'

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

const MANUAL_POINT_REASONS = ['Daily entries', 'Fixing', 'Random', 'Other']

export function resolveManualPointReason(reason, customReason) {
  return reason === 'Other' ? customReason.trim() : reason
}

export function buildManualPointAdjustmentPayload({
  studentId,
  pointsDelta,
  reason,
  reasonType,
  sourceContext,
  metadata = {},
}) {
  return {
    studentId,
    pointsDelta,
    reminderDelta: 0,
    reason,
    eventType: 'adjustment',
    category: 'manual',
    sourceContext,
    metadata: {
      ...metadata,
      reasonType,
    },
  }
}

export default function BehaviorPage({
  students,
  searchedStudents,
  openStudent,
  initials,
  isVIP,
  S,
  statusColor,
  statusEmoji,
  statusLabel,
  onAdjustPoints,
  CLASSES = [],
  additionalClassIdsByStudent = {},
}) {
  const [behaviorStudent, setBehaviorStudent] = useState(null)
  const [behaviorTab, setBehaviorTab] = useState('positive')
  const [classFilter, setClassFilter] = useState('all')
  const [bulkSelectedIds, setBulkSelectedIds] = useState([])
  const [bulkPointAmount, setBulkPointAmount] = useState(1)
  const [manualReason, setManualReason] = useState('Daily entries')
  const [manualCustomReason, setManualCustomReason] = useState('')
  const [manualPointDrafts, setManualPointDrafts] = useState({})
  const [bulkExpanded, setBulkExpanded] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')

  const sortedSearchedStudents = [...searchedStudents].sort((firstStudent, secondStudent) => secondStudent.points - firstStudent.points)
  const classFilteredStudents = sortedSearchedStudents.filter(student => studentBelongsToClass(student, classFilter, additionalClassIdsByStudent))

  function toggleBulkStudent(studentId) {
    setBulkSelectedIds(previous => previous.includes(studentId)
      ? previous.filter(selectedId => selectedId !== studentId)
      : [...previous, studentId]
    )
    setBulkMessage('')
  }

  function selectAllVisibleStudents() {
    setBulkSelectedIds(classFilteredStudents.map(student => student.id))
    setBulkMessage('')
  }

  function getManualReason() {
    return resolveManualPointReason(manualReason, manualCustomReason)
  }

  async function applyManualPoints(studentId, amount = manualPointDrafts[studentId]) {
    const pointsDelta = Number(amount || 0)
    const reason = getManualReason()
    if (!Number.isFinite(pointsDelta) || pointsDelta === 0) return
    if (!reason) {
      alert('Choose or enter a reason for this point adjustment.')
      return
    }

    playSound(pointsDelta > 0 ? 'positive' : 'negative')
    const ok = await onAdjustPoints(buildManualPointAdjustmentPayload({
      studentId,
      pointsDelta,
      reason,
      sourceContext: 'points-page-manual-adjustment',
      reasonType: manualReason,
    }))

    if (ok !== false) {
      setManualPointDrafts(previous => ({ ...previous, [studentId]: '' }))
    }
  }

  async function applyBulkPoints(amount = bulkPointAmount) {
    const pointsDelta = Number(amount || 0)
    const reason = getManualReason()
    if (bulkSelectedIds.length === 0 || !Number.isFinite(pointsDelta) || pointsDelta === 0) return
    if (!reason) {
      alert('Choose or enter a reason for this bulk point adjustment.')
      return
    }

    setBulkSaving(true)
    setBulkMessage('')
    playSound(pointsDelta > 0 ? 'positive' : 'negative')

    const results = await Promise.all(
      bulkSelectedIds.map(async studentId => {
        try {
          return await onAdjustPoints(buildManualPointAdjustmentPayload({
            studentId,
            pointsDelta,
            reason,
            sourceContext: 'points-page-bulk-manual-adjustment',
            reasonType: manualReason,
            metadata: {
              bulkSelectionSize: bulkSelectedIds.length,
            },
          }))
        } catch (error) {
          console.error('Failed to save behavior bulk points:', error)
          return false
        }
      }),
    )

    const failedCount = results.filter(result => result === false).length
    const savedCount = bulkSelectedIds.length - failedCount

    if (failedCount > 0) {
      setBulkMessage(`Saved ${savedCount} of ${bulkSelectedIds.length}. ${failedCount} did not save.`)
    } else {
      setBulkMessage(`${pointsDelta > 0 ? 'Added' : 'Subtracted'} ${Math.abs(pointsDelta)} point${Math.abs(pointsDelta) === 1 ? '' : 's'} ${pointsDelta > 0 ? 'to' : 'from'} ${savedCount} student${savedCount === 1 ? '' : 's'}.`)
      setBulkSelectedIds([])
    }

    setBulkSaving(false)
  }

  function addPoints(id, amount) {
    const reason = getManualReason()
    if (!reason) {
      alert('Choose or enter a reason for this point adjustment.')
      return
    }

    playSound(amount > 0 ? 'positive' : 'negative')
    onAdjustPoints(buildManualPointAdjustmentPayload({
      studentId: id,
      pointsDelta: amount,
      reason,
      sourceContext: 'points-page-detail-manual-adjustment',
      reasonType: manualReason,
    }))
  }

  function addReminder(id) {
    const s = students.find(x => x.id === id)
    playSound(s && s.reminders + 1 >= 6 ? 'redmark' : 'negative')
    onAdjustPoints({
      studentId: id,
      pointsDelta: 0,
      reminderDelta: 1,
      reason: 'Reminder',
      eventType: 'reminder',
      category: 'behavior',
      sourceContext: 'behavior-page-reminder',
    })
  }

  function applyBehavior(studentId, beh) {
    playSound(beh.points > 0 ? 'positive' : 'negative')
    onAdjustPoints({
      studentId,
      pointsDelta: beh.points,
      reminderDelta: beh.points < 0 ? 1 : 0,
      reason: beh.label,
      eventType: beh.points > 0 ? 'award' : 'deduction',
      category: 'behavior',
      sourceContext: 'behavior-page-preset',
      metadata: {
        behaviorId: beh.id,
      },
    })
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Behavior & Points</h1>
      {behaviorStudent ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <button onClick={() => setBehaviorStudent(null)} style={S.btn('ghost')}>← Back</button>
            <div style={S.avatar(behaviorStudent.id - 1, 38)}>{initials(behaviorStudent.name)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{behaviorStudent.name}</div>
              <div style={{ color: '#9a6a2a', fontWeight: 700, fontSize: 13 }}>
                {students.find(s => s.id === behaviorStudent.id)?.points} pts · {students.find(s => s.id === behaviorStudent.id)?.reminders} reminders
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setBehaviorTab('positive')} style={S.btn(behaviorTab === 'positive' ? 'success' : 'ghost')}>✅ Positive</button>
            <button onClick={() => setBehaviorTab('negative')} style={S.btn(behaviorTab === 'negative' ? 'danger' : 'ghost')}>⚠️ Reminders</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {(behaviorTab === 'positive' ? BEHAVIORS_POSITIVE : BEHAVIORS_NEGATIVE).map(beh => (
              <button
                key={beh.id}
                onClick={() => applyBehavior(behaviorStudent.id, beh)}
                style={{
                  background: behaviorTab === 'positive' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${behaviorTab === 'positive' ? '#86efac' : '#fca5a5'}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>{beh.label}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: behaviorTab === 'positive' ? '#4b6854' : '#9f1239' }}>
                  {beh.points > 0 ? '+' : ''}{beh.points}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={() => addPoints(behaviorStudent.id, 10)} style={S.btn('success')}>+10 Points</button>
            <button onClick={() => addPoints(behaviorStudent.id, -10)} style={S.btn('danger')}>-10 Points</button>
            <button onClick={() => addReminder(behaviorStudent.id)} style={{ ...S.btn('danger'), background: '#7f1d1d' }}>⚠️ Reminder</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ ...S.card, marginBottom: 14, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#223046' }}>Fast Manual Points</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Enter signed values beside each student. Example: 37 adds points, -20 subtracts points.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={manualReason} onChange={event => setManualReason(event.target.value)} style={{ minHeight: 38, padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', background: '#fff', fontSize: 12, fontWeight: 700 }}>
                  {MANUAL_POINT_REASONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                </select>
                {manualReason === 'Other' && (
                  <input
                    value={manualCustomReason}
                    onChange={event => setManualCustomReason(event.target.value)}
                    placeholder="Custom reason"
                    spellCheck
                    lang="en"
                    style={{ minHeight: 38, padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }}
                  />
                )}
              </div>
            </div>
          </div>

          <div style={{ ...S.card, marginBottom: 14, display: 'grid', gap: bulkExpanded ? 12 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#223046' }}>Bulk Points</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                  Select students from this roster and apply one signed adjustment.
                </div>
              </div>
              <button onClick={() => setBulkExpanded(open => !open)} style={S.btn(bulkExpanded ? 'primary' : 'ghost')}>
                {bulkExpanded ? 'Hide Bulk Points' : 'Show Bulk Points'}
              </button>
            </div>

            {bulkExpanded && (
            <div style={{ border: '1px solid #dce4ed', borderRadius: 12, padding: 12, background: '#f8fbff', display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
                  {bulkSelectedIds.length} selected
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={selectAllVisibleStudents} style={S.btn('ghost')}>Select Visible</button>
                  <button onClick={() => setBulkSelectedIds([])} style={S.btn('ghost')}>Clear</button>
                </div>
              </div>

              <div style={{ border: '1px solid #dce4ed', borderRadius: 9, background: '#ffffff', maxHeight: 260, overflowY: 'auto' }}>
                {classFilteredStudents.map(student => {
                  const isSelected = bulkSelectedIds.includes(student.id)
                  return (
                    <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderBottom: '1px solid #edf2f7', cursor: 'pointer', background: isSelected ? '#f3f7ff' : '#ffffff' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleBulkStudent(student.id)} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#334155' }}>{student.name}</span>
                      <span style={{ fontSize: 11, color: '#8a6b25', fontWeight: 800 }}>{student.points} pts</span>
                    </label>
                  )
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                {[1, 2, 3, 5, 10, -1, -5].map(amount => (
                  <button
                    key={amount}
                    disabled={bulkSaving || bulkSelectedIds.length === 0}
                    onClick={() => applyBulkPoints(amount)}
                    style={{
                      ...S.btn('success'),
                      opacity: bulkSaving || bulkSelectedIds.length === 0 ? 0.55 : 1,
                    }}
                  >
                    {amount > 0 ? '+' : ''}{amount}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(180px, 1fr) auto', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  value={bulkPointAmount}
                  onChange={event => setBulkPointAmount(Number(event.target.value))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                />
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>Reason: {getManualReason() || 'required'}</div>
                <button
                  disabled={bulkSaving || bulkSelectedIds.length === 0 || Number(bulkPointAmount || 0) === 0 || !getManualReason()}
                  onClick={() => applyBulkPoints()}
                  style={{
                    ...S.btn('primary'),
                    opacity: bulkSaving || bulkSelectedIds.length === 0 || Number(bulkPointAmount || 0) === 0 || !getManualReason() ? 0.55 : 1,
                  }}
                >
                  {bulkSaving ? 'Saving...' : 'Apply Custom'}
                </button>
              </div>

              {bulkMessage && (
                <div style={{ fontSize: 12, fontWeight: 800, color: bulkMessage.includes('did not save') ? '#9f1239' : '#4b6854' }}>
                  {bulkMessage}
                </div>
              )}
            </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Class:</span>
            <select value={classFilter} onChange={event => setClassFilter(event.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #dce4ed', background: '#fff', fontSize: 12, fontWeight: 700, minWidth: 160 }}>
              <option value="all">All Students</option>
              {CLASSES.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          {classFilteredStudents.map((s, i) => {
            const vip = isVIP(s)
            return (
              <div
                key={s.id}
                onClick={() => setBehaviorStudent(s)}
                style={{
                  ...S.card,
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '36px minmax(0, 1fr)',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderLeft: vip ? '3px solid #ca8a04' : undefined,
                }}
              >
                <div style={S.avatar(s.id - 1, 36)}>{initials(s.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {s.name}{vip && <span style={{ fontSize: 11 }}>⭐</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                    {s.reminders > 0 && <span style={S.badge('#9f1239', '#fee2e2')}>⚠️ {s.reminders}</span>}
                  </div>
                </div>
                <div onClick={event => event.stopPropagation()} style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'minmax(72px, 1fr) auto', gap: 6, marginTop: 2 }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={manualPointDrafts[s.id] || ''}
                    onChange={event => setManualPointDrafts(previous => ({ ...previous, [s.id]: event.target.value }))}
                    onKeyDown={event => {
                      if (event.key === 'Enter') applyManualPoints(s.id)
                    }}
                    placeholder="+/- pts"
                    aria-label={`Manual point adjustment for ${s.name}`}
                    style={{ minHeight: 38, padding: '8px 9px', border: '1px solid #dce4ed', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', width: '100%' }}
                  />
                  <button
                    onClick={() => applyManualPoints(s.id)}
                    disabled={!manualPointDrafts[s.id] || !getManualReason()}
                    style={{ ...S.btn('primary'), minHeight: 38, padding: '8px 10px', opacity: !manualPointDrafts[s.id] || !getManualReason() ? 0.55 : 1 }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )
          })}
          </div>
        </>
      )}
    </div>
  )
}
