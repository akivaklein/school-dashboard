import { useState } from 'react'
import {
  createStudentTask,
  deleteStudentTask,
  getStudentTaskDueAt,
  getStudentTaskStatus,
  updateStudentTask,
  type StudentTask,
  type StudentTaskRepeat,
} from '../services/studentTasksService'

type StyleApi = { card: Record<string, string | number>; btn: (tone?: string) => Record<string, string | number>; badge: (color: string, background: string) => Record<string, string | number> }
type StudentRef = { id: number | string; name?: string }

type FormState = { title: string; note: string; date: string; time: string; repeatType: StudentTaskRepeat }

function todayValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function taskToForm(task: StudentTask): FormState {
  const due = new Date(task.due_at)
  return {
    title: task.title,
    note: task.note,
    date: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`,
    time: `${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}`,
    repeatType: task.repeat_type,
  }
}

function emptyForm(): FormState {
  return { title: '', note: '', date: todayValue(), time: '09:00', repeatType: 'one_time' }
}

function dueInputValue(form: FormState) {
  return new Date(`${form.date}T${form.time || '09:00'}`).toISOString()
}

function formatDue(task: StudentTask, now = new Date()) {
  return getStudentTaskDueAt(task, now).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function statusStyle(status: string, S: StyleApi) {
  if (status === 'Overdue') return S.badge('#9f1239', '#fee2e2')
  if (status === 'Done') return S.badge('#166534', '#dcfce7')
  return S.badge('#1d4ed8', '#dbeafe')
}

function TaskForm({ form, setForm, onSave, onCancel, saving }: { form: FormState; setForm: (next: FormState) => void; onSave: () => void; onCancel?: () => void; saving: boolean }) {
  return (
    <div style={{ border: '1px solid #dbe4ef', borderRadius: 10, padding: 14, background: '#fff', marginBottom: 14 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Short task" style={{ padding: '9px 10px', border: '1px solid #dbe4ef', borderRadius: 7, fontSize: 13 }} />
        <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Optional note" rows={2} style={{ padding: '9px 10px', border: '1px solid #dbe4ef', borderRadius: 7, fontSize: 13, resize: 'vertical' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ fontSize: 11, color: '#64748b' }}>Due date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px', border: '1px solid #dbe4ef', borderRadius: 7 }} /></label>
          <label style={{ fontSize: 11, color: '#64748b' }}>Due time<input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px', border: '1px solid #dbe4ef', borderRadius: 7 }} /></label>
        </div>
        <label style={{ fontSize: 11, color: '#64748b' }}>Repeat<select value={form.repeatType} onChange={e => setForm({ ...form, repeatType: e.target.value as StudentTaskRepeat })} style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px', border: '1px solid #dbe4ef', borderRadius: 7, background: '#fff' }}><option value="one_time">One time</option><option value="daily_until_done">Daily until done</option></select></label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {onCancel && <button onClick={onCancel} style={{ padding: '7px 11px', border: '1px solid #dbe4ef', borderRadius: 7, background: '#fff', cursor: 'pointer' }}>Cancel</button>}
          <button onClick={onSave} disabled={saving || !form.title.trim()} style={{ padding: '7px 12px', border: 'none', borderRadius: 7, background: '#0f172a', color: '#fff', cursor: 'pointer', opacity: saving || !form.title.trim() ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save task'}</button>
        </div>
      </div>
    </div>
  )
}

export default function StudentTasksTab({ studentId, tasks, setTasks, userName, S }: { studentId: number | string; tasks: StudentTask[]; setTasks: React.Dispatch<React.SetStateAction<StudentTask[]>>; userName: string; S: StyleApi }) {
  const [form, setForm] = useState<FormState | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const studentTasks = tasks.filter(task => Number(task.student_id) === Number(studentId))
  const now = new Date()

  async function saveTask() {
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const updated = editingId
        ? await updateStudentTask(editingId, { title: form.title, note: form.note, due_at: dueInputValue(form), repeat_type: form.repeatType })
        : await createStudentTask({ studentId: Number(studentId), title: form.title, note: form.note, dueAt: dueInputValue(form), repeatType: form.repeatType, createdBy: userName || 'Staff' })
      setTasks(previous => editingId ? previous.map(task => task.id === updated.id ? updated : task) : [updated, ...previous])
      setForm(null)
      setEditingId(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save task.')
    } finally {
      setSaving(false)
    }
  }

  async function setDone(task: StudentTask, done: boolean) {
    try {
      const updated = await updateStudentTask(task.id, { completed_at: done ? new Date().toISOString() : null, completed_by: done ? (userName || 'Staff') : null })
      setTasks(previous => previous.map(item => item.id === updated.id ? updated : item))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update task.')
    }
  }

  async function removeTask(task: StudentTask) {
    if (!window.confirm(`Delete “${task.title}”?`)) return
    try {
      await deleteStudentTask(task.id)
      setTasks(previous => previous.filter(item => item.id !== task.id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete task.')
    }
  }

  const sortedTasks = [...studentTasks].sort((a, b) => Number(Boolean(a.completed_at)) - Number(Boolean(b.completed_at)) || getStudentTaskDueAt(a, now).getTime() - getStudentTaskDueAt(b, now).getTime())

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...S.card, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: form ? 12 : 0 }}>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>Reminders / Tasks</div><div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>Open tasks stay here until someone marks them Done.</div></div>
          {!form && <button onClick={() => { setEditingId(null); setForm(emptyForm()); setError('') }} style={S.btn('primary')}>Add task</button>}
        </div>
        {form && <TaskForm form={form} setForm={setForm} onSave={saveTask} onCancel={() => { setForm(null); setEditingId(null) }} saving={saving} />}
        {error && <div style={{ color: '#9f1239', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {sortedTasks.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, paddingTop: 14 }}>No reminders or tasks yet.</div>}
        {sortedTasks.map(task => {
          const status = getStudentTaskStatus(task, now)
          return <div key={task.id} style={{ borderTop: '1px solid #eef2f6', padding: '12px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <input type="checkbox" checked={status === 'Done'} onChange={() => setDone(task, status !== 'Done')} title={status === 'Done' ? 'Reopen task' : 'Mark task done'} style={{ marginTop: 3, cursor: 'pointer' }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><strong style={{ fontSize: 13, textDecoration: status === 'Done' ? 'line-through' : 'none' }}>{task.title}</strong><span style={statusStyle(status, S)}>{status}</span></div><div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{formatDue(task, now)} · {task.repeat_type === 'daily_until_done' ? 'Daily until done' : 'One time'} · Created by {task.created_by} on {new Date(task.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>{task.note && <div style={{ color: '#334155', fontSize: 12, marginTop: 5 }}>{task.note}</div>}{status === 'Done' && task.completed_by && <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>Completed by {task.completed_by}</div>}</div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}><button onClick={() => { setEditingId(task.id); setForm(taskToForm(task)); setError('') }} style={{ padding: '4px 7px', border: '1px solid #dbe4ef', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11 }}>Edit</button><button onClick={() => removeTask(task)} style={{ padding: '4px 7px', border: '1px solid #fecdd3', borderRadius: 6, background: '#fff7f7', color: '#9f1239', cursor: 'pointer', fontSize: 11 }}>Delete</button></div>
          </div>
        })}
      </div>
    </div>
  )
}

export function StudentTasksDashboard({ tasks, students, openStudent, S }: { tasks: StudentTask[]; students: StudentRef[]; openStudent: (student: StudentRef, tab?: string) => void; S: StyleApi }) {
  const now = new Date()
  const studentById = new Map(students.map(student => [Number(student.id), student]))
  const openTasks = tasks.filter(task => !task.completed_at && studentById.has(Number(task.student_id)))
  const todayLimit = now.getTime() + 60 * 60 * 1000
  const groups = [
    { label: 'Overdue', tasks: openTasks.filter(task => getStudentTaskStatus(task, now) === 'Overdue') },
    { label: 'Due now / today', tasks: openTasks.filter(task => getStudentTaskStatus(task, now) === 'Due' && getStudentTaskDueAt(task, now).toDateString() === now.toDateString() && getStudentTaskDueAt(task, now).getTime() <= todayLimit) },
    { label: 'Later today', tasks: openTasks.filter(task => getStudentTaskStatus(task, now) === 'Due' && getStudentTaskDueAt(task, now).toDateString() === now.toDateString() && getStudentTaskDueAt(task, now).getTime() > todayLimit) },
    { label: 'Upcoming', tasks: openTasks.filter(task => getStudentTaskStatus(task, now) === 'Due' && getStudentTaskDueAt(task, now).toDateString() !== now.toDateString()) },
  ]
  const visibleGroups = groups.map(group => ({ ...group, tasks: group.tasks.slice().sort((a, b) => getStudentTaskDueAt(a, now).getTime() - getStudentTaskDueAt(b, now).getTime()).slice(0, 5) })).filter(group => group.tasks.length > 0)

  return <div style={{ ...S.card, borderRadius: 12, padding: 20, marginBottom: 20 }}>
    <div style={{ marginBottom: 14 }}><div style={{ fontSize: 17, color: '#102a43', fontWeight: 800 }}>Reminders / Tasks</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Student tasks that still need attention</div></div>
    {visibleGroups.length === 0 && <div style={{ color: '#64748b', fontSize: 13 }}>No open student tasks.</div>}
    {visibleGroups.map(group => <div key={group.label} style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 800, color: group.label === 'Overdue' ? '#9f1239' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{group.label}</div>{group.tasks.map(task => { const student = studentById.get(Number(task.student_id)); return <button key={task.id} onClick={() => student && openStudent(student, 'tasks')} style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', border: 'none', borderTop: '1px solid #eef2f6', background: 'transparent', cursor: 'pointer' }}><span style={{ minWidth: 0 }}><strong style={{ display: 'block', color: '#263241', fontSize: 12 }}>{student?.name || 'Student'} · {task.title}</strong><span style={{ color: '#64748b', fontSize: 11 }}>{formatDue(task, now)}</span></span><span style={statusStyle(getStudentTaskStatus(task, now), S)}>{getStudentTaskStatus(task, now)}</span></button> })}</div>)}
  </div>
}
