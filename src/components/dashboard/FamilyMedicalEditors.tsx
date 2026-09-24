import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { persistStudentFields } from '../../services/studentPersistenceService'
import { S, asStringMap, type StudentLike } from './dashboardHelpers'

export function FamilyEditorPopup({ s, setStudents, userName }: { s: StudentLike; setStudents: Dispatch<SetStateAction<StudentLike[]>>; userName: string | null }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>✏️ Edit Family Info</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>✏️ Edit Family Info — {s.name}</div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <FamilyEditor s={s} setStudents={setStudents} userName={userName} onCancel={() => setOpen(false)} onSaved={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

export function MedicalEditorPopup({ s, setStudents, userName }: { s: StudentLike; setStudents: Dispatch<SetStateAction<StudentLike[]>>; userName: string | null }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>✏️ Edit Medical Info</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>🏥 Edit Medical Info — {s.name}</div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <MedicalEditor s={s} setStudents={setStudents} userName={userName} onCancel={() => setOpen(false)} onSaved={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}


export function FamilyEditor({ s, setStudents, userName, onCancel = null, onSaved = null }: { s: StudentLike; setStudents: Dispatch<SetStateAction<StudentLike[]>>; userName: string | null; onCancel?: (() => void) | null; onSaved?: (() => void) | null }) {
  const [f, setF] = useState<Record<string, string>>((s.family as Record<string, string>) || {})

  async function save() {
    const nextFamily = {
      ...f,
      lastEditedBy: userName || 'Staff',
      lastEditedAt: new Date().toISOString(),
    }

    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, family: nextFamily } : x))
    
    // Persist to database
    await persistStudentFields(s.id, { family: nextFamily })
    
    if (onSaved) onSaved()
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[['fatherName','Father Name'],['fatherPhone','Father Phone'],['fatherEmail','Father Email'],['motherName','Mother Name'],['motherPhone','Mother Phone'],['motherEmail','Mother Email']].map(([key, label]) => (
          <input key={key} placeholder={label} value={f[key]||''} onChange={e => setF(prev => ({...prev, [key]: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
        ))}
      </div>
      <input placeholder="Home Address" value={f.address||''} onChange={e => setF(prev => ({...prev, address: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <input placeholder="Emergency Contact" value={f.emergencyContact||''} onChange={e => setF(prev => ({...prev, emergencyContact: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
        <input placeholder="Emergency Phone" value={f.emergencyPhone||''} onChange={e => setF(prev => ({...prev, emergencyPhone: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onCancel && <button onClick={onCancel} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>}
        <button onClick={save} style={{ ...S.btn('primary'), flex: 1 }}>💾 Save</button>
      </div>
    </div>
  )
}

export function MedicalEditor({ s, setStudents, userName, onCancel = null, onSaved = null }: { s: StudentLike; setStudents: Dispatch<SetStateAction<StudentLike[]>>; userName: string | null; onCancel?: (() => void) | null; onSaved?: (() => void) | null }) {
  const [m, setM] = useState<Record<string, string>>(() => asStringMap(s.medical))

  async function save() {
    const nextMedical = {
      ...m,
      lastEditedBy: userName || 'Staff',
      lastEditedAt: new Date().toISOString(),
    }

    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, medical: nextMedical } : x))
    
    // Persist to database
    await persistStudentFields(s.id, { medical: nextMedical })
    
    if (onSaved) onSaved()
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>🏥 Doctor Info</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Doctor Name" value={m.doctorName||''} onChange={e => setM(prev => ({...prev, doctorName: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
          <input placeholder="Doctor Phone" value={m.doctorPhone||''} onChange={e => setM(prev => ({...prev, doctorPhone: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>💊 Allergies</div>
        <textarea placeholder="List allergies (comma-separated), e.g.: peanuts (severe), shellfish (moderate)" value={m.allergiesText||''} onChange={e => setM(prev => ({...prev, allergiesText: e.target.value}))} spellCheck lang="en" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📋 Conditions</div>
        <textarea placeholder="List conditions (comma-separated), e.g.: asthma, diabetes, anxiety" value={m.conditionsText||''} onChange={e => setM(prev => ({...prev, conditionsText: e.target.value}))} spellCheck lang="en" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📝 Last Physical</div>
        <input placeholder="Date of last physical" value={m.lastPhysical||''} onChange={e => setM(prev => ({...prev, lastPhysical: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📌 Medical Notes</div>
        <textarea placeholder="Any additional medical notes..." value={m.notes||''} onChange={e => setM(prev => ({...prev, notes: e.target.value}))} spellCheck lang="en" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onCancel && <button onClick={onCancel} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>}
        <button onClick={save} style={{ ...S.btn('primary'), flex: 1 }}>💾 Save</button>
      </div>
    </div>
  )
}
