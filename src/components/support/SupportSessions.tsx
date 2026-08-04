import { useEffect, useMemo, useState } from 'react'
import {
  buildSupportSessionsStudentFilter,
  endSupportSessionRecord,
  listSupportSessions,
  startSupportSessionRecord,
} from '../../services/supportSessionsService'
import { supabase } from '../../supabaseClient'
import { mergeSupportSessionEntries, type SupportSessionEntry } from '../../services/realtimePersistence'
import type {
  StaffMember,
  StudentLike,
  SupportSession,
} from '../../types/supportSession'
import { mergeStudentFields } from '../../utils/studentStatus'

type Props = {
  students: StudentLike[]
  setStudents: React.Dispatch<React.SetStateAction<StudentLike[]>>
  staff: StaffMember[]
}

const cardStyle: React.CSSProperties = {
  background: '#fafaf8',
  border: '1px solid #dfe4e7',
  borderRadius: 15,
  padding: 18,
  boxShadow: '0 4px 13px rgba(41,52,64,0.05)',
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 10px',
  borderRadius: 9,
  border: '1px solid #d8dfe3',
  marginBottom: 10,
}

function buttonStyle(kind: 'primary' | 'success' | 'ghost'): React.CSSProperties {
  const palette = {
    primary: { background: '#4f6687', color: '#fff', border: '#4f6687' },
    success: { background: '#edf3ee', color: '#587261', border: '#cbd9cf' },
    ghost: { background: '#fff', color: '#617080', border: '#d8dfe3' },
  }[kind]

  return {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${palette.border}`,
    background: palette.background,
    color: palette.color,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  }
}

export default function SupportSessions({ students, setStudents, staff }: Props) {
  const [sessions, setSessions] = useState<SupportSession[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const scopedStudentIds = useMemo(
    () => Array.from(
      new Set(
        students
          .map(student => Number(student.id))
          .filter(id => Number.isFinite(id) && id > 0),
      ),
    ),
    [students],
  )
  const scopedStudentIdSet = useMemo(() => new Set(scopedStudentIds), [scopedStudentIds])
  const scopedStudentFilter = useMemo(
    () => buildSupportSessionsStudentFilter(scopedStudentIds),
    [scopedStudentIds],
  )
  const scopedChannelName = useMemo(
    () => `support-sessions-${scopedStudentIds.join('-') || 'none'}`,
    [scopedStudentIds],
  )

  useEffect(() => {
    if (!scopedStudentFilter) return

    const sessionsChannel = supabase
      .channel(scopedChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_sessions',
          filter: scopedStudentFilter,
        },
        payload => {
          const nextRow = payload.new as Record<string, unknown> | null
          const oldRow = payload.old as Record<string, unknown> | null
          const eventType = payload.eventType || 'INSERT'
          const rowForScope = eventType === 'DELETE' ? oldRow : nextRow
          const rowStudentId = Number(rowForScope?.student_id)

          if (!Number.isFinite(rowStudentId) || !scopedStudentIdSet.has(rowStudentId)) {
            return
          }

          if (eventType === 'DELETE') {
            setSessions(prev => mergeSupportSessionEntries(prev as SupportSessionEntry[], oldRow as SupportSessionEntry, 'DELETE'))
            return
          }

          if (!nextRow) return
          setSessions(prev => mergeSupportSessionEntries(prev as SupportSessionEntry[], nextRow as SupportSessionEntry, eventType as string))
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Supabase realtime channel error: ${scopedChannelName}`)
        }
      })

    return () => {
      supabase.removeChannel(sessionsChannel)
    }
  }, [scopedStudentFilter, scopedStudentIdSet, scopedChannelName])

  const [studentId, setStudentId] = useState<StudentLike['id']>(students[0]?.id || '')
  const [staffId, setStaffId] = useState('')
  const [serviceType, setServiceType] = useState('Therapy')
  const selectedStudentId = studentId || students[0]?.id || ''

  const [endingSessionId, setEndingSessionId] = useState<SupportSession['id'] | null>(null)
  const [returnLocation, setReturnLocation] = useState('back-in-class')
  const [notes, setNotes] = useState('')
  const [goalWorkedOn, setGoalWorkedOn] = useState('')
  const [studentResponse, setStudentResponse] = useState('')
  const [followUpNeeded, setFollowUpNeeded] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setErrorMessage('')
        if (!scopedStudentIds.length) {
          if (active) setSessions([])
          return
        }
        const rows = await listSupportSessions()
        if (active) {
          setSessions(rows.filter(session => scopedStudentIdSet.has(Number(session.student_id))))
        }
      } catch (error) {
        console.error('Error loading support sessions:', error)
        if (active) setErrorMessage('Unable to load support sessions.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [scopedStudentIds, scopedStudentIdSet])

  const activeSessions = useMemo(
    () => sessions.filter(session => !session.ended_at),
    [sessions],
  )

  const supportStaff = useMemo(
    () => staff.filter(member =>
      /teacher|rebbe|admin|menahel|sgan|mashgiach|bt|speech|ot|counselor/i.test(member.role || ''),
    ),
    [staff],
  )

  async function startSession() {
    const student = students.find(item => Number(item.id) === Number(selectedStudentId))
    const staffMember = staff.find(item => item.id === staffId)

    if (!student) return alert('Choose a student.')
    if (!staffMember) return alert('Choose a staff member.')
    if (activeSessions.some(session => Number(session.student_id) === Number(student.id))) {
      return alert('This student already has an active support session.')
    }

    try {
      setSaving(true)
      setErrorMessage('')
      const result = await startSupportSessionRecord(student, staffMember, serviceType)
      setStudents(previous => mergeStudentFields(previous, student.id, result.studentFields))
      setSessions(previous => [result.session, ...previous])
      setStaffId('')
      setServiceType('Therapy')
    } catch (error) {
      console.error('Error starting support session:', error)
      const details = error instanceof Error ? error.message : 'Unable to start the support session.'
      setErrorMessage(details)
    } finally {
      setSaving(false)
    }
  }

  async function finishSession() {
    const session = sessions.find(item => Number(item.id) === Number(endingSessionId))
    if (!session) return

    try {
      setSaving(true)
      setErrorMessage('')
      const result = await endSupportSessionRecord(session, {
        returnLocation,
        notes,
        goalWorkedOn,
        studentResponse,
        followUpNeeded,
      })

      setStudents(previous => mergeStudentFields(previous, session.student_id, result.studentFields))
      setSessions(previous => previous.map(item =>
        Number(item.id) === Number(session.id)
          ? {
              ...item,
              ended_at: result.endedAt,
              return_location: returnLocation,
              notes: notes || null,
              goal_worked_on: goalWorkedOn || null,
              student_response: studentResponse || null,
              follow_up_needed: followUpNeeded,
            }
          : item,
      ))

      setEndingSessionId(null)
      setReturnLocation('back-in-class')
      setNotes('')
      setGoalWorkedOn('')
      setStudentResponse('')
      setFollowUpNeeded(false)
    } catch (error) {
      console.error('Error ending support session:', error)
      const details = error instanceof Error ? error.message : 'Unable to end the support session.'
      setErrorMessage(details)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {errorMessage && (
        <div style={{ ...cardStyle, marginBottom: 12, color: '#965468', background: '#fff7f8' }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 16, alignItems: 'start' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#34465a', marginBottom: 5 }}>
            Start Support Session
          </div>
          <div style={{ fontSize: 11, color: '#778493', marginBottom: 14 }}>
            Start Therapy, BT, OT, Speech, Counseling, or another support service.
          </div>

          <label style={{ fontSize: 11, color: '#6f7d8c' }}>Student</label>
          <select value={selectedStudentId} onChange={event => setStudentId(event.target.value)} style={fieldStyle}>
            {students.map(student => <option key={String(student.id)} value={student.id}>{student.name}</option>)}
          </select>

          <label style={{ fontSize: 11, color: '#6f7d8c' }}>Staff member</label>
          <select value={staffId} onChange={event => setStaffId(event.target.value)} style={fieldStyle}>
            <option value="">Choose staff</option>
            {supportStaff.map(member => <option key={member.id} value={member.id}>{member.name} · {member.role}</option>)}
          </select>

          <label style={{ fontSize: 11, color: '#6f7d8c' }}>Service</label>
          <select value={serviceType} onChange={event => setServiceType(event.target.value)} style={{ ...fieldStyle, marginBottom: 14 }}>
            <option>Therapy</option><option>BT Support</option><option>Speech</option>
            <option>OT</option><option>Counseling</option><option>PT</option>
            <option>BCBA Observation</option><option>Academic Support</option>
          </select>

          <button disabled={saving} onClick={startSession} style={{ ...buttonStyle('primary'), width: '100%', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Start Session'}
          </button>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#34465a', marginBottom: 12 }}>Active Sessions</div>
          {loading && <div style={{ color: '#778493', fontSize: 12 }}>Loading sessions...</div>}
          {!loading && activeSessions.length === 0 && (
            <div style={{ border: '1px dashed #ccd5dd', borderRadius: 12, padding: 18, color: '#778493', fontSize: 12, textAlign: 'center' }}>
              No active support sessions.
            </div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {activeSessions.map(session => (
              <div key={String(session.id)} style={{ border: '1px solid #dfe4e7', borderRadius: 12, padding: 13, background: '#f7f8f8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#34465a' }}>{session.student_name}</div>
                    <div style={{ fontSize: 11, color: '#687789', marginTop: 3 }}>{session.service_type} · {session.staff_name}</div>
                    <div style={{ fontSize: 10.5, color: '#8793a0', marginTop: 3 }}>
                      Started {new Date(session.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <button onClick={() => setEndingSessionId(session.id)} style={buttonStyle('success')}>End Session</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, borderTop: '1px solid #e1e5e8', paddingTop: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#34465a', marginBottom: 10 }}>Recent Session History</div>
            {sessions.filter(session => session.ended_at).slice(0, 8).map(session => (
              <div key={String(session.id)} style={{ padding: '9px 0', borderBottom: '1px solid #e6e9eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b style={{ fontSize: 11.5, color: '#46576a' }}>{session.student_name}</b>
                  <span style={{ fontSize: 10, color: '#8793a0' }}>{session.return_location || 'Completed'}</span>
                </div>
                <div style={{ fontSize: 10.5, color: '#687789', marginTop: 3 }}>{session.service_type} · {session.staff_name}</div>
                {session.notes && <div style={{ fontSize: 11, color: '#526274', marginTop: 5 }}>{session.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {endingSessionId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 500, maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: 15, padding: 20, boxShadow: '0 24px 70px rgba(15,23,42,0.25)' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#34465a', marginBottom: 14 }}>End Support Session</div>
            <label style={{ fontSize: 11, color: '#6f7d8c' }}>Where is the student now?</label>
            <select value={returnLocation} onChange={event => setReturnLocation(event.target.value)} style={fieldStyle}>
              <option value="back-in-class">Back in class</option>
              <option value="lunch">Lunch</option><option value="recess">Recess</option>
              <option value="office">Office</option><option value="dismissed">Dismissed / left early</option>
              <option value="unknown">Other / location unknown</option>
            </select>
            <input value={goalWorkedOn} onChange={event => setGoalWorkedOn(event.target.value)} placeholder="Goal worked on" style={fieldStyle} spellCheck lang="en" />
            <textarea value={studentResponse} onChange={event => setStudentResponse(event.target.value)} placeholder="How did the student respond?" rows={3} style={fieldStyle} spellCheck lang="en" />
            <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Session notes" rows={4} style={fieldStyle} spellCheck lang="en" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#526274', marginBottom: 16 }}>
              <input type="checkbox" checked={followUpNeeded} onChange={event => setFollowUpNeeded(event.target.checked)} /> Follow-up needed
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={saving} onClick={() => setEndingSessionId(null)} style={{ ...buttonStyle('ghost'), flex: 1 }}>Cancel</button>
              <button disabled={saving} onClick={finishSession} style={{ ...buttonStyle('success'), flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save and End Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
