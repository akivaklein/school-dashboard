import { useState } from 'react'
import { CalendarDays, Save } from 'lucide-react'
import { saveStudentDob } from '../services/shachrisService'
import { calculateAge } from '../utils/shachris'

type Props = { studentId: number | string; dob?: string | null; editable: boolean; onSaved: (dob: string | null) => void }

export default function StudentDobEditor({ studentId, dob, editable, onSaved }: Props) {
  const [value, setValue] = useState(dob || '')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const age = calculateAge(dob)

  async function save() {
    setSaving(true)
    setFeedback('')
    try {
      await saveStudentDob(studentId, value || null)
      onSaved(value || null)
      setFeedback('Date of birth saved.')
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : 'Could not save the date of birth.')
    } finally {
      setSaving(false)
    }
  }

  return <section style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
    <h3 style={{ margin: '0 0 12px', fontSize: 15, display: 'flex', gap: 8, alignItems: 'center' }}><CalendarDays size={18} /> Date of Birth</h3>
    <div style={{ display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
      <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>Regular DOB<input aria-label="Regular date of birth" type="date" value={value} disabled={!editable || saving} onChange={event => { setValue(event.target.value); setFeedback('') }} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} /></label>
      <div style={{ paddingBottom: 9, fontSize: 14 }}>Age: <strong>{age ?? 'Not set'}</strong></div>
      {editable && <button disabled={saving || value === (dob || '')} onClick={() => void save()} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '9px 12px', background: '#145b48', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}><Save size={16} />{saving ? 'Saving...' : 'Save DOB'}</button>}
    </div>
    {feedback && <p role="status" style={{ marginBottom: 0, fontSize: 12 }}>{feedback}</p>}
  </section>
}