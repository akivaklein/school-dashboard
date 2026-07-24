import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function StudentNotes({ student, students, setStudents, userName, S }) {
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const s = students.find(x => x.id === student.id) || student

  async function addNote() {
    if (!noteText.trim()) return
    if (!s?.id) return

    const newNote = {
      date: new Date().toISOString().slice(0, 10),
      author: userName || 'Staff',
      text: noteText.trim(),
    }

    setSaving(true)

    // Update student notes array in students table (JSONB persistence)
    const updatedNotes = [...(s.notes || []), newNote]
    const { error: updateError } = await supabase
      .from('students')
      .update({ notes: updatedNotes })
      .eq('id', s.id)

    if (updateError) {
      setSaving(false)
      console.error('Error saving student note to students table:', updateError)
      alert('Could not save note. Check console.')
      return
    }

    // Also insert into student_notes table for audit log
    const { error: insertError } = await supabase
      .from('student_notes')
      .insert([
        {
          student_id: Number(s.id),
          student_name: s.name,
          note: newNote.text,
          author: newNote.author,
          created_at: new Date().toISOString(),
        },
      ])

    setSaving(false)

    if (insertError) {
      console.error('Error saving note to audit log:', insertError)
      // Note was saved to student record, so don't fail completely
    }

    setStudents(prev =>
      prev.map(x =>
        x.id === s.id
          ? { ...x, notes: updatedNotes }
          : x
      )
    )

    setNoteText('')
  }

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Staff Notes</div>
      {(!s.notes || s.notes.length === 0) ? (
        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>No notes yet.</div>
      ) : (
        s.notes.map((n, i) => (
          <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>{n.author}</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{n.date}</span>
            </div>
            <div style={{ fontSize: 13, color: '#334155' }}>{n.text}</div>
          </div>
        ))
      )}
      <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
        <textarea
          placeholder="Add a note..."
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }}
        />
        <button onClick={addNote} style={S.btn('primary')} disabled={saving || !noteText.trim()}>
          {saving ? 'Saving...' : 'Add Note'}
        </button>
      </div>
    </div>
  )
}
