import { useEffect, useMemo, useState } from 'react'
import { resolveActorName } from './dashboardData'
import { supabase } from '../supabaseClient'
import {
  archiveStudentNote,
  canManageStudentNote,
  createStudentNote,
  listStudentNotes,
  updateStudentNote,
  type StudentNoteRecord,
} from '../services/studentNotesService'

export default function StudentNotes({ student, students, setStudents, userName, role, S }) {
  const [noteText, setNoteText] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [notes, setNotes] = useState<StudentNoteRecord[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [busyNoteId, setBusyNoteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)
  const s = students.find(x => x.id === student.id) || student

  const actorName = useMemo(
    () => resolveActorName(userName, role),
    [role, userName],
  )

  function formatNoteTimestamp(timestamp: string | null | undefined) {
    if (!timestamp) return 'Unknown time'
    const parsed = new Date(timestamp)
    if (Number.isNaN(parsed.getTime())) return 'Unknown time'
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function syncStudentNotesIntoProfile(nextNotes: StudentNoteRecord[]) {
    const mapped = nextNotes.map(note => ({
      id: note.id,
      date: String(note.created_at || '').slice(0, 10),
      author: note.author || note.created_by_name || 'Staff',
      text: note.note,
    }))

    setStudents(prev => prev.map(entry => (
      Number(entry.id) === Number(s.id)
        ? { ...entry, notes: mapped }
        : entry
    )))
  }

  async function refreshNotes() {
    if (!s?.id) return
    setLoadingNotes(true)
    try {
      const rows = await listStudentNotes(Number(s.id))
      setNotes(rows)
      syncStudentNotesIntoProfile(rows)
      setSaveError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load notes right now.'
      setSaveError(message)
    } finally {
      setLoadingNotes(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionUserId(data.user?.id || null)
    })
  }, [])

  useEffect(() => {
    if (!s?.id) return

    refreshNotes()

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
        () => {
          refreshNotes()
        }
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase realtime channel error: student-notes')
        }
      })

    return () => {
      supabase.removeChannel(notesChannel)
    }
  }, [s?.id])

  useEffect(() => {
    if (!successMessage) return
    const timer = window.setTimeout(() => setSuccessMessage(null), 2200)
    return () => window.clearTimeout(timer)
  }, [successMessage])

  async function addNote() {
    if (!noteText.trim()) return
    if (!s?.id) return

    setSaving(true)
    setSaveError(null)

    try {
      await createStudentNote({
        studentId: Number(s.id),
        studentName: String(s.name || ''),
        note: noteText.trim(),
        author: actorName,
        actorName,
      })
      setNoteText('')
      setSuccessMessage('Note added.')
      await refreshNotes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save note right now.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  async function saveEditedNote(note: StudentNoteRecord) {
    if (!editingText.trim()) return
    setBusyNoteId(note.id)
    setSaveError(null)
    try {
      await updateStudentNote({
        noteId: note.id,
        note: editingText.trim(),
        actorName,
      })
      setEditingNoteId(null)
      setEditingText('')
      setSuccessMessage('Note updated.')
      await refreshNotes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update note right now.'
      setSaveError(message)
    } finally {
      setBusyNoteId(null)
    }
  }

  async function deleteNote(idx: number) {
    if (!s?.id) return
    const note = notes[idx]
    if (!note) return

    setBusyNoteId(note.id)
    setSaveError(null)

    try {
      await archiveStudentNote({
        noteId: note.id,
        actorName,
      })
      setConfirmDeleteIdx(null)
      setSuccessMessage('Note removed.')
      await refreshNotes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove note right now.'
      setSaveError(message)
    } finally {
      setBusyNoteId(null)
    }
  }

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Staff Notes</div>
      {loadingNotes ? (
        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Loading notes...</div>
      ) : notes.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>No notes yet.</div>
      ) : (
        notes.map((n, i) => {
          const canManage = canManageStudentNote({
            role,
            actorUserId: sessionUserId,
            noteCreatedByUserId: n.created_by_user_id,
          })

          const isEditing = editingNoteId === n.id
          const noteBusy = busyNoteId === n.id

          return (
            <div key={n.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{n.author || n.created_by_name || 'Staff'}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>{formatNoteTimestamp(n.created_at)}</span>
                  {n.updated_at && (
                    <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>
                      Updated by {n.updated_by_name || n.author || 'Staff'} · {formatNoteTimestamp(n.updated_at)}
                    </span>
                  )}
                </div>
                {canManage && confirmDeleteIdx === i ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Delete this note?</span>
                    <button onClick={() => deleteNote(i)} disabled={noteBusy} style={{ padding: '2px 10px', borderRadius: 6, border: '1px solid #ef4444', background: '#fef2f2', color: '#dc2626', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>{noteBusy ? 'Deleting...' : 'Delete'}</button>
                    <button onClick={() => setConfirmDeleteIdx(null)} style={{ padding: '2px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#64748b', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : canManage ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => {
                      setEditingNoteId(n.id)
                      setEditingText(n.note)
                      setConfirmDeleteIdx(null)
                    }} title="Edit note" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: '0 2px', lineHeight: 1 }}>✏</button>
                    <button onClick={() => setConfirmDeleteIdx(i)} title="Delete note" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>🗑</button>
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <div>
                  <textarea
                    value={editingText}
                    onChange={event => setEditingText(event.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, minHeight: 72, boxSizing: 'border-box', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEditedNote(n)} disabled={noteBusy || !editingText.trim()} style={{ ...S.btn('primary'), padding: '6px 12px', fontSize: 12 }}>{noteBusy ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => { setEditingNoteId(null); setEditingText('') }} style={{ ...S.btn('ghost'), padding: '6px 12px', fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#334155' }}>{n.note}</div>
              )}
            </div>
          )
        })
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
        {successMessage && (
          <div style={{ color: '#166534', fontSize: 12, marginBottom: 8 }}>{successMessage}</div>
        )}
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
