import { useState } from 'react'

type CleanupResult = { success: boolean; error?: string }

function ConfirmCleanupModal({
  title,
  description,
  confirmPhrase,
  confirmButtonLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmPhrase: string
  confirmButtonLabel: string
  onCancel: () => void
  onConfirm: () => Promise<void>
}) {
  const [typedPhrase, setTypedPhrase] = useState('')
  const [running, setRunning] = useState(false)
  const canConfirm = typedPhrase.trim() === confirmPhrase && !running

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(15,23,42,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #fecaca', background: '#fef2f2' }}>
          <div style={{ fontWeight: 800, color: '#991b1b', fontSize: 15 }}>⚠️ {title}</div>
        </div>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{description}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Type <strong style={{ color: '#991b1b' }}>{confirmPhrase}</strong> below to confirm.
          </div>
          <input
            value={typedPhrase}
            onChange={event => setTypedPhrase(event.target.value)}
            placeholder={confirmPhrase}
            spellCheck={false}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #fca5a5', fontSize: 14, fontWeight: 700, textAlign: 'center' }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} disabled={running} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 700, cursor: running ? 'default' : 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={async () => { setRunning(true); await onConfirm(); setRunning(false) }}
              disabled={!canConfirm}
              style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: canConfirm ? '#dc2626' : '#fca5a5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: canConfirm ? 'pointer' : 'default' }}
            >
              {running ? 'Working…' : confirmButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DataCleanupSection({
  S,
  onClearGradesHistory,
  onClearPointsHistory,
}: {
  S: any
  onClearGradesHistory: () => Promise<CleanupResult>
  onClearPointsHistory: () => Promise<CleanupResult>
}) {
  const [showGradesConfirm, setShowGradesConfirm] = useState(false)
  const [showPointsConfirm, setShowPointsConfirm] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  async function runClearGrades() {
    const result = await onClearGradesHistory()
    setShowGradesConfirm(false)
    setMessage(result.success
      ? { tone: 'success', text: 'Grades/Scores history cleared. Students, staff, and setup are untouched.' }
      : { tone: 'error', text: result.error || 'Unable to clear grades history.' })
  }

  async function runClearPoints() {
    const result = await onClearPointsHistory()
    setShowPointsConfirm(false)
    setMessage(result.success
      ? { tone: 'success', text: 'Points/Behavior history cleared and balances reset to 0. Students, staff, and setup are untouched.' }
      : { tone: 'error', text: result.error || 'Unable to clear points history.' })
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {message && (
        <div style={{
          ...S.card,
          border: `1px solid ${message.tone === 'success' ? '#bbf7d0' : '#fecaca'}`,
          background: message.tone === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.tone === 'success' ? '#166534' : '#991b1b',
          fontSize: 13,
          fontWeight: 700,
        }}>
          {message.text}
        </div>
      )}

      <div style={S.card}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#223046', marginBottom: 6 }}>Danger Zone — Test Data Cleanup</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          These actions permanently delete history rows. They never delete or archive students, staff, users, assignments, or setup configuration. Use only after confirming that current grades/points data is test data.
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ border: '1px solid #fecaca', borderRadius: 12, padding: 14, background: '#fff7f7' }}>
            <div style={{ fontWeight: 800, color: '#7f1d1d', fontSize: 14 }}>Clear Grades/Scores History</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 10 }}>
              Permanently deletes every grade entry and clears each student's test score history. Students and classes are not affected.
            </div>
            <button onClick={() => setShowGradesConfirm(true)} style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Clear Grades/Scores History…
            </button>
          </div>

          <div style={{ border: '1px solid #fecaca', borderRadius: 12, padding: 14, background: '#fff7f7' }}>
            <div style={{ fontWeight: 800, color: '#7f1d1d', fontSize: 14 }}>Clear Points/Behavior History</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 10 }}>
              Permanently deletes every points/behavior event and resets every student's point balance and reminder count to 0 so balances stay consistent. Students and classes are not affected.
            </div>
            <button onClick={() => setShowPointsConfirm(true)} style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Clear Points/Behavior History…
            </button>
          </div>
        </div>
      </div>

      {showGradesConfirm && (
        <ConfirmCleanupModal
          title="Clear Grades/Scores History"
          description="This permanently deletes every grade entry for every student. This cannot be undone. Students, staff, users, assignments, and setup are not affected."
          confirmPhrase="CLEAR SCORES"
          confirmButtonLabel="Permanently Clear Grades"
          onCancel={() => setShowGradesConfirm(false)}
          onConfirm={runClearGrades}
        />
      )}

      {showPointsConfirm && (
        <ConfirmCleanupModal
          title="Clear Points/Behavior History"
          description="This permanently deletes every points/behavior event and resets every student's point balance and reminders to 0. This cannot be undone. Students, staff, users, assignments, and setup are not affected."
          confirmPhrase="CLEAR POINTS"
          confirmButtonLabel="Permanently Clear Points"
          onCancel={() => setShowPointsConfirm(false)}
          onConfirm={runClearPoints}
        />
      )}
    </div>
  )
}
