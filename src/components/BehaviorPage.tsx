import { useState } from 'react'
import playSound from '../utils/playSound'

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
}) {
  const [behaviorStudent, setBehaviorStudent] = useState(null)
  const [behaviorTab, setBehaviorTab] = useState('positive')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = useState([])
  const [bulkPointAmount, setBulkPointAmount] = useState(1)
  const [bulkReason, setBulkReason] = useState('Bulk points')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')

  const sortedSearchedStudents = [...searchedStudents].sort((firstStudent, secondStudent) => secondStudent.points - firstStudent.points)

  function toggleBulkMode() {
    setBulkMode(previous => {
      const nextValue = !previous
      if (!nextValue) {
        setBulkSelectedIds([])
        setBulkMessage('')
      }
      return nextValue
    })
  }

  function toggleBulkStudent(studentId) {
    setBulkSelectedIds(previous => previous.includes(studentId)
      ? previous.filter(selectedId => selectedId !== studentId)
      : [...previous, studentId]
    )
    setBulkMessage('')
  }

  function selectAllVisibleStudents() {
    setBulkSelectedIds(sortedSearchedStudents.map(student => student.id))
    setBulkMessage('')
  }

  async function applyBulkPoints(amount = bulkPointAmount) {
    const pointsDelta = Number(amount || 0)
    if (bulkSelectedIds.length === 0 || !Number.isFinite(pointsDelta) || pointsDelta <= 0) return

    setBulkSaving(true)
    setBulkMessage('')
    playSound('positive')

    const reason = bulkReason.trim() || `Bulk +${pointsDelta} pts`
    const results = await Promise.all(
      bulkSelectedIds.map(async studentId => {
        try {
          return await onAdjustPoints({
            studentId,
            pointsDelta,
            reminderDelta: 0,
            reason,
            eventType: 'award',
            category: 'behavior',
            sourceContext: 'behavior-page-bulk-award',
            metadata: {
              bulkSelectionSize: bulkSelectedIds.length,
            },
          })
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
      setBulkMessage(`Added ${pointsDelta} point${pointsDelta === 1 ? '' : 's'} to ${savedCount} student${savedCount === 1 ? '' : 's'}.`)
      setBulkSelectedIds([])
    }

    setBulkSaving(false)
  }

  function addPoints(id, amount) {
    playSound(amount > 0 ? 'positive' : 'negative')
    onAdjustPoints({
      studentId: id,
      pointsDelta: amount,
      reason: amount > 0 ? `+${amount} pts` : `${amount} pts`,
      eventType: amount > 0 ? 'award' : 'deduction',
      category: 'behavior',
      sourceContext: 'behavior-page-adjustment',
    })
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
          <div style={{ ...S.card, marginBottom: 14, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#223046' }}>Bulk Points</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                  Select multiple students here and add points once.
                </div>
              </div>
              <button onClick={toggleBulkMode} style={S.btn(bulkMode ? 'ghost' : 'primary')}>
                {bulkMode ? 'Close Bulk' : 'Bulk Add Points'}
              </button>
            </div>

            {bulkMode && (
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {[1, 2, 3, 5, 10].map(amount => (
                    <button
                      key={amount}
                      disabled={bulkSaving || bulkSelectedIds.length === 0}
                      onClick={() => applyBulkPoints(amount)}
                      style={{
                        ...S.btn('success'),
                        opacity: bulkSaving || bulkSelectedIds.length === 0 ? 0.55 : 1,
                      }}
                    >
                      +{amount}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(180px, 1fr) auto', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    value={bulkPointAmount}
                    onChange={event => setBulkPointAmount(Number(event.target.value))}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                  />
                  <input
                    value={bulkReason}
                    onChange={event => setBulkReason(event.target.value)}
                    placeholder="Reason shown in behavior log"
                    spellCheck
                    lang="en"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                  />
                  <button
                    disabled={bulkSaving || bulkSelectedIds.length === 0 || Number(bulkPointAmount || 0) <= 0}
                    onClick={() => applyBulkPoints()}
                    style={{
                      ...S.btn('primary'),
                      opacity: bulkSaving || bulkSelectedIds.length === 0 || Number(bulkPointAmount || 0) <= 0 ? 0.55 : 1,
                    }}
                  >
                    {bulkSaving ? 'Saving...' : 'Add Custom'}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {sortedSearchedStudents.map((s, i) => {
            const vip = isVIP(s)
            const selectedForBulk = bulkSelectedIds.includes(s.id)
            return (
              <div
                key={s.id}
                onClick={() => bulkMode ? toggleBulkStudent(s.id) : setBehaviorStudent(s)}
                style={{
                  ...S.card,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  border: selectedForBulk ? '2px solid #5f84bb' : S.card.border,
                  borderLeft: vip ? '3px solid #ca8a04' : selectedForBulk ? '2px solid #5f84bb' : undefined,
                  background: selectedForBulk ? '#f3f7ff' : S.card.background,
                }}
              >
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={selectedForBulk}
                    onChange={() => toggleBulkStudent(s.id)}
                    onClick={event => event.stopPropagation()}
                  />
                )}
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
              </div>
            )
          })}
          </div>
        </>
      )}
    </div>
  )
}
