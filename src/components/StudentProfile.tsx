import { useState } from 'react'
import StudentNotes from './StudentNotes'

export default function StudentProfile({
  student,
  students,
  setStudents,
  onClose,
  role,
  userName = '',
  defaultTab = 'overview',
  S,
  STAFF,
  DAYS,
  statusColor,
  statusEmoji,
  statusLabel,
  initials,
  isVIP,
  getImprovement,
  daysSince,
  TrackingTab,
  pointsEvents = [],
  onUndoPointsEvent,
  StudentScoresTab,
  FamilyEditorPopup,
  MedicalEditorPopup,
}) {
  const [tab, setTab] = useState(defaultTab)
  const [callNotes, setCallNotes] = useState('')
  const [callStaff, setCallStaff] = useState('Rabbi Klein')
  const [callDuration, setCallDuration] = useState('')
  const [pendingUndoEvent, setPendingUndoEvent] = useState(null)
  const [undoSaving, setUndoSaving] = useState(false)
  const [undoFeedback, setUndoFeedback] = useState(null)
  const s = students.find(x => x.id === student.id)
  const improvement = getImprovement(s)
  const vip = isVIP(s)
  const absCount = s.att.filter(d => d === 'A').length
  const lateCount = s.att.filter(d => d === 'L').length
  const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
  const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
  const reversedEventIds = new Set(
    pointsEvents
      .filter(event => event.related_event_id != null)
      .map(event => Number(event.related_event_id))
  )

  async function confirmUndoEvent() {
    if (!pendingUndoEvent || typeof onUndoPointsEvent !== 'function' || undoSaving) return

    setUndoSaving(true)
    try {
      const ok = await onUndoPointsEvent(pendingUndoEvent)
      if (!ok) {
        throw new Error('Undo did not complete.')
      }
      setUndoFeedback({
        type: 'success',
        message: `Undo complete for "${pendingUndoEvent.reason}".`,
      })
      setPendingUndoEvent(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to undo this event right now.'
      setUndoFeedback({ type: 'error', message })
      setPendingUndoEvent(null)
    } finally {
      setUndoSaving(false)
    }
  }

  function addCall() { if (!callNotes.trim()) return; setStudents(prev => prev.map(x => x.id === s.id ? { ...x, parentCalls: [...x.parentCalls, { date: new Date().toISOString().slice(0,10), staff: callStaff, notes: callNotes, duration: callDuration }] } : x)); setCallNotes(''); setCallDuration('') }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(15,23,42,0.22)' }}>
        <div style={{ background: vip ? 'linear-gradient(135deg, #854d0e, #a16207)' : '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={S.avatar(s.id - 1, 48)}>{initials(s.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              {s.name}{vip && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>⭐ VIP</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ ...S.tag(statusColor[s.status]), fontSize: 11 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
              {withStaffObj && <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 8px', borderRadius: 14, fontSize: 11, fontWeight: 600 }}>👤 With {withStaffObj.name}</span>}
              {s.iep && <span style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', padding: '2px 8px', borderRadius: 14, fontSize: 11, fontWeight: 600 }}>📋 IEP</span>}
              {s.detention && <span style={{ background: 'rgba(220,38,38,0.3)', color: '#fca5a5', padding: '2px 8px', borderRadius: 14, fontSize: 11, fontWeight: 600 }}>⚠️ Detention</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, color: '#fff', textAlign: 'center' }}>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{s.points}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Points</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: s.reminders >= 6 ? '#f87171' : '#fff' }}>{s.reminders}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Reminders</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>{absCount}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Absences</div></div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px', background: '#ffffff', overflowX: 'auto', overflowY: 'hidden', flexShrink: 0 }}>
          {['overview','attendance','tracking','behavior','pointsHistory','therapy','testScores','calls','notes','info'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400, borderBottom: tab === t ? '2px solid #0f172a' : '2px solid transparent', color: tab === t ? '#0f172a' : '#64748b', textTransform: 'capitalize', whiteSpace: 'nowrap', flexShrink: 0 }}>{t}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', background: '#f8fafc' }}>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {vip && <div style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #fef9c3, #fef08a)', border: '2px solid #ca8a04', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 32 }}>⭐</span><div><div style={{ fontWeight: 700, fontSize: 15, color: '#854d0e' }}>VIP Student!</div><div style={{ fontSize: 13, color: '#92400e' }}>Perfect week — eligible for VIP rewards!</div></div></div>}
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>This Week Summary</div>
                {[['Present days', s.att.filter(d=>d==='P').length+'/6'],['Late arrivals', lateCount],['Absences', absCount],['Points', s.points+' pts'],['Reminders', s.reminders],['Last call', lastCall ? daysSince(lastCall.date)+'d ago' : 'Never']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...S.card, borderLeft: `3px solid ${improvement.color}` }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>📈 vs Last Week</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: improvement.color }}>{improvement.icon} {improvement.label}</div>
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Attendance</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {DAYS.map((day, i) => (
                      <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{day}</div>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: s.att[i]==='P'?'#dcfce7':s.att[i]==='A'?'#fee2e2':'#dbeafe', color: s.att[i]==='P'?'#56765f':s.att[i]==='A'?'#9f1239':'#4f6687', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, margin: '0 auto' }}>{s.att[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {withStaffObj && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #3f6b76' }}><div style={{ fontWeight: 700, color: '#3f6b76', marginBottom: 4, fontSize: 13 }}>📍 Currently With</div><div style={{ fontSize: 14 }}><strong>{withStaffObj.name}</strong> — {withStaffObj.role}</div></div>}
              {s.status === 'unknown' && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #9f1239', background: '#fef2f2' }}><div style={{ fontWeight: 700, color: '#9f1239', marginBottom: 4, fontSize: 13 }}>❓ Location Unknown</div><div style={{ fontSize: 13, color: '#9f1239' }}>Student location is unaccounted for. Please locate immediately.</div></div>}
              {s.iep && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #6d28d9' }}><div style={{ fontWeight: 700, color: '#6d28d9', marginBottom: 4, fontSize: 13 }}>📋 IEP</div><div style={{ fontSize: 13 }}>{s.iepDetails}</div></div>}
            </div>
          )}
          {tab === 'attendance' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Attendance Record</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}><th style={{ textAlign: 'left', padding: 10 }}>Day</th><th style={{ padding: 10, textAlign: 'center' }}>Status</th><th style={{ padding: 10, textAlign: 'center' }}>Breakfast</th></tr></thead>
                <tbody>
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'].map((day, i) => (
                    <tr key={day} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: 10 }}>{day}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        <span style={S.badge(
                          s.att[i]==='P'?'#4b6854':s.att[i]==='A'?'#9f1239':s.att[i]==='LE'?'#5b5f7a':'#1d4ed8',
                          s.att[i]==='P'?'#dcfce7':s.att[i]==='A'?'#fee2e2':s.att[i]==='LE'?'#f5f3ff':'#dbeafe'
                        )}>{s.att[i]==='P'?'Present':s.att[i]==='A'?'Absent':s.att[i]==='LE'?'Left Early':'Late'}</span>
                      </td>
                      <td style={{ padding: 10, textAlign: 'center' }}><span style={S.badge(s.breakfast[i]==='Y'?'#4b6854':'#9f1239', s.breakfast[i]==='Y'?'#dcfce7':'#fee2e2')}>{s.breakfast[i]==='Y'?'✓ Breakfast':'✗ Skipped'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'tracking' && (
            <TrackingTab s={s} students={students} />
          )}

          {tab === 'behavior' && (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ ...S.statCard('#9a6a2a'), flex: 1 }}><div style={{ fontSize: 11, color: '#64748b' }}>Points</div><div style={{ fontSize: 26, fontWeight: 700, color: '#9a6a2a' }}>{s.points}</div></div>
                <div style={{ ...S.statCard('#9f1239'), flex: 1 }}><div style={{ fontSize: 11, color: '#64748b' }}>Reminders</div><div style={{ fontSize: 26, fontWeight: 700, color: '#9f1239' }}>{s.reminders}</div></div>
                <div style={{ ...S.statCard(improvement.color), flex: 1 }}><div style={{ fontSize: 11, color: '#64748b' }}>Trend</div><div style={{ fontSize: 13, fontWeight: 700, color: improvement.color, marginTop: 4 }}>{improvement.icon} {improvement.label}</div></div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Behavior Log</div>
                {s.behaviorLog.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 13 }}>No events yet.</div> : s.behaviorLog.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                    <span>{b.label}</span><span style={{ fontWeight: 700, color: b.points > 0 ? '#4b6854' : '#9f1239' }}>{b.points > 0 ? '+' : ''}{b.points}</span><span style={{ color: '#94a3b8' }}>{b.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'pointsHistory' && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Points History</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Ledger entries from points_events for this student.</div>
                </div>
                <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{pointsEvents.length} event{pointsEvents.length === 1 ? '' : 's'}</div>
              </div>
              {undoFeedback && (
                <div
                  style={{
                    marginBottom: 12,
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    border: undoFeedback.type === 'success' ? '1px solid #86efac' : '1px solid #fecaca',
                    background: undoFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: undoFeedback.type === 'success' ? '#166534' : '#991b1b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span>{undoFeedback.message}</span>
                  <button
                    onClick={() => setUndoFeedback(null)}
                    style={{ ...S.btn('ghost'), padding: '4px 8px', fontSize: 11 }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {pointsEvents.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>No point events recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pointsEvents.map(event => {
                    const isReversal = event.event_type === 'reversal' || event.related_event_id != null
                    const canUndo =
                      event.event_type !== 'reversal' &&
                      !reversedEventIds.has(Number(event.id)) &&
                      typeof onUndoPointsEvent === 'function'
                    const deltaLabel = event.points_delta > 0 ? `+${event.points_delta}` : `${event.points_delta}`

                    return (
                      <div key={event.id} style={{ background: '#f8fafc', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                              <span style={S.badge(event.points_delta >= 0 ? '#4b6854' : '#9f1239', event.points_delta >= 0 ? '#dcfce7' : '#fee2e2')}>{deltaLabel} pts</span>
                              <span style={S.badge('#334155', '#e2e8f0')}>{event.event_type}</span>
                              {isReversal && <span style={S.badge('#7c3aed', '#ede9fe')}>Reversal</span>}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{event.reason}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                              {event.staff_name} · {event.staff_role || 'staff'} · {new Date(event.created_at).toLocaleString()}
                            </div>
                            {event.note && <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>{event.note}</div>}
                            {event.related_event_id && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 6 }}>Reverses event #{event.related_event_id}</div>}
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {canUndo && (
                              <button
                                onClick={() => {
                                  setUndoFeedback(null)
                                  setPendingUndoEvent(event)
                                }}
                                style={{
                                  ...S.btn('ghost'),
                                  padding: '6px 10px',
                                  fontSize: 12,
                                }}
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          {tab === 'therapy' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Therapy & Services</div>
              {s.services.length === 0 ? <div style={{ color: '#94a3b8' }}>No therapy services assigned.</div> : s.services.map((svc, i) => {
                const staffMember = STAFF.find(st => st.id === svc.staffId)
                return <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{svc.type}</div><div style={{ color: '#64748b', fontSize: 13 }}>With: <strong>{staffMember?.name}</strong></div><div style={{ color: '#5b5f7a', fontWeight: 600, fontSize: 13, marginTop: 4 }}>{svc.hrs} hrs/week</div></div>
              })}
            </div>
          )}
          {tab === 'testScores' && (
            <StudentScoresTab student={s} students={students} setStudents={setStudents} role={role} userName={userName} />
          )}

          {tab === 'calls' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>📞 Parent Call Log</div>
              {s.parentCalls.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>No calls recorded yet.</div> : s.parentCalls.map((c, i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ displays: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{c.staff}</span><span style={{ color: '#94a3b8', fontSize: 12 }}>{c.date} · {c.duration}</span></div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{c.notes}</div>
                </div>
              ))}
              {role !== 'therapist' && role !== 'store' && (
                <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Log a new call</div>
                  <input placeholder="Staff name" value={callStaff} onChange={e => setCallStaff(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  <input placeholder="Duration (e.g. 5 min)" value={callDuration} onChange={e => setCallDuration(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  <textarea placeholder="Call notes..." value={callNotes} onChange={e => setCallNotes(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }} />
                  <button onClick={addCall} style={S.btn('primary')}>Log Call</button>
                </div>
              )}
            </div>
          )}
          {tab === 'notes' && (
            <StudentNotes student={s} students={students} setStudents={setStudents} userName={userName} S={S} />
          )}

          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Allergies alert */}
              {s.medical?.allergies?.length > 0 && (
                <div style={{ background: '#fef2f2', border: '2px solid #9f1239', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#9f1239', marginBottom: 8 }}>⚠️ ALLERGIES</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {s.medical.allergies.map((a, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12, background: a.severity === 'severe' ? '#9f1239' : a.severity === 'moderate' ? '#9a6a2a' : '#64748b', color: '#fff' }}>
                        {a.name} — {a.severity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Family */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#111827' }}>👨‍👩‍👦 Family & Contact</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Father', s.family?.fatherName, s.family?.fatherPhone, s.family?.fatherEmail],
                    ['Mother', s.family?.motherName, s.family?.motherPhone, s.family?.motherEmail],
                  ].map(([label, name, phone, email]) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{name || '—'}</div>
                      {phone && <div style={{ fontSize: 13, color: '#4f6687' }}>📞 {phone}</div>}
                      {email && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>✉️ {email}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.family?.address && <div style={{ fontSize: 13, color: '#334155' }}>🏠 {s.family.address}</div>}
                  {s.family?.emergencyContact && <div style={{ fontSize: 13, color: '#9f1239', fontWeight: 600 }}>🚨 Emergency: {s.family.emergencyContact} · {s.family.emergencyPhone}</div>}
                </div>
                {role === 'admin' && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                    <FamilyEditorPopup s={s} setStudents={setStudents} />
                  </div>
                )}
              </div>

              {/* Medical */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#111827' }}>🏥 Medical Information</div>
                {s.medical?.medications?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6, textTransform: 'uppercase' }}>💊 Medications</div>
                    {s.medical.medications.map((m, i) => (
                      <div key={i} style={{ background: '#f0f9ff', borderRadius: 6, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</span>
                          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{m.dosage}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{m.frequency}</span>
                      </div>
                    ))}
                  </div>
                )}
                {s.medical?.conditions?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6, textTransform: 'uppercase' }}>📋 Conditions</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {s.medical.conditions.map((c, i) => <span key={i} style={S.badge('#5b5f7a', '#f5f3ff')}>{c}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {s.medical?.doctorName && <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>DOCTOR</div><div style={{ fontWeight: 600, fontSize: 13 }}>{s.medical.doctorName}</div>{s.medical.doctorPhone && <div style={{ fontSize: 12, color: '#4f6687' }}>📞 {s.medical.doctorPhone}</div>}</div>}
                  {s.medical?.lastPhysical && <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>LAST PHYSICAL</div><div style={{ fontWeight: 600, fontSize: 13 }}>{s.medical.lastPhysical}</div></div>}
                </div>
                {s.medical?.notes && <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>📝 {s.medical.notes}</div>}
                {role === 'admin' && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                    <MedicalEditorPopup s={s} setStudents={setStudents} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {pendingUndoEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, border: '1px solid #e2e8f0', boxShadow: '0 24px 70px rgba(15,23,42,0.22)' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Confirm Undo</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>This will create a reversal entry in points history.</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 12, color: '#334155', marginBottom: 6 }}>Event</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{pendingUndoEvent.reason}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {pendingUndoEvent.points_delta > 0 ? '+' : ''}{pendingUndoEvent.points_delta} pts · {pendingUndoEvent.event_type}
              </div>
            </div>
            <div style={{ padding: '12px 18px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setPendingUndoEvent(null)}
                disabled={undoSaving}
                style={{ ...S.btn('ghost'), padding: '7px 11px', fontSize: 12, opacity: undoSaving ? 0.7 : 1 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmUndoEvent}
                disabled={undoSaving}
                style={{ ...S.btn('danger'), padding: '7px 11px', fontSize: 12, opacity: undoSaving ? 0.7 : 1 }}
              >
                {undoSaving ? 'Undoing...' : 'Confirm Undo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

