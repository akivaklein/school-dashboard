import { useEffect, useState } from 'react'
import { resolveActorName } from './dashboardData'
import { supabase } from '../supabaseClient'
import { mergeStudentNoteEntries, type StudentNoteEntry } from '../services/realtimePersistence'

export default function StudentNotes({ student, students, setStudents, userName, S }) {
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)
  const s = students.find(x => x.id === student.id) || student

  useEffect(() => {
    if (!s?.id) return

    const notesChannel = supabase
      .channel(`student-notes-${s.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_notes',
          filter: `student_id=eq.${Number(s.id)}`,
        },
        payload => {
          const nextNote = payload.new as Record<string, unknown> | null
          if (payload.eventType === 'DELETE') {
            setStudents(prev => prev.map(studentEntry => studentEntry.id === s.id ? { ...studentEntry, notes: (studentEntry.notes || []).filter((note: any) => String(note.id ?? `${note.date}|${note.author}|${note.text}`) !== String((payload.old as Record<string, unknown> | null)?.id ?? '')) } : studentEntry))
            return
          }

          if (!nextNote) return
          const entry = {
            id: Number(nextNote.id),
            date: nextNote.created_at ? String(nextNote.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
            author: String(nextNote.author || 'Staff'),
            text: String(nextNote.note || ''),
          }

          setStudents(prev => prev.map(studentEntry => studentEntry.id === s.id ? { ...studentEntry, notes: mergeStudentNoteEntries(studentEntry.notes || [], entry as StudentNoteEntry) } : studentEntry))
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase realtime channel error: student-notes')
        }
      })

    return () => {
      supabase.removeChannel(notesChannel)
    }
  }, [s?.id, setStudents])

  async function addNote() {
    if (!noteText.trim()) return
    if (!s?.id) return

    const newNote = {
      date: new Date().toISOString().slice(0, 10),
      author: resolveActorName(userName, 'admin'),
      text: noteText.trim(),
    }

    setSaving(true)
    setSaveError(null)

    // Update student notes array in students table (JSONB persistence)
    const updatedNotes = [...(s.notes || []), newNote]
    const { error: updateError } = await supabase
      .from('students')
      .update({ notes: updatedNotes })
      .eq('id', s.id)

    if (updateError) {
      setSaving(false)
      const message = updateError.message || 'Unable to save note to the student record.'
      setSaveError(message)
      console.error('Error saving student note to students table:', updateError)
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
      const message = insertError.message || 'Unable to save note to the audit log.'
      setSaveError(message)
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

  async function deleteNote(idx: number) {
    if (!s?.id) return
    const updatedNotes = (s.notes || []).filter((_, i) => i !== idx)
    const { error } = await supabase.from('students').update({ notes: updatedNotes }).eq('id', s.id)
    if (error) { console.error('Error deleting note:', error); return }
    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, notes: updatedNotes } : x))
    setConfirmDeleteIdx(null)
  }

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Staff Notes</div>
      {(!s.notes || s.notes.length === 0) ? (
        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>No notes yet.</div>
      ) : (
        s.notes.map((n, i) => (
          <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 12 }}>{n.author}</span>
                <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>{n.date}</span>
              </div>
              {confirmDeleteIdx === i ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Delete this note?</span>
                  <button onClick={() => deleteNote(i)} style={{ padding: '2px 10px', borderRadius: 6, border: '1px solid #ef4444', background: '#fef2f2', color: '#dc2626', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Delete</button>
                  <button onClick={() => setConfirmDeleteIdx(null)} style={{ padding: '2px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#64748b', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteIdx(i)} title="Delete note" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>🗑</button>
              )}
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
          spellCheck
          lang="en"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }}
        />
        {saveError && (
          <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 8 }}>{saveError}</div>
        )}
        <button onClick={addNote} style={S.btn('primary')} disabled={saving || !noteText.trim()}>
          {saving ? 'Saving...' : 'Add Note'}
        </button>
      </div>
    </div>
  )
}
