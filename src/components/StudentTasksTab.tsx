import { useState } from 'react'
import {
  createStudentTask,
  completeStudentTask,
  deleteStudentTask,
  getStudentTaskDueAt,
  getStudentTaskStatus,
  snoozeStudentTask,
  updateStudentTask,
  type StudentTask,
  type StudentTaskRepeat,
  type StudentTaskNotification,
} from '../services/studentTasksService'

type StyleApi = { card: Record<string, string | number>; btn: (tone?: string) => Record<string, string | number>; badge: (color: string, background: string) => Record<string, string | number> }
type StudentRef = { id: number | string; name?: string }

type FormState = { title: string; note: string; date: string; time: string; reminderDate: string; reminderTime: string; repeatType: StudentTaskRepeat; recurrenceDays: number[]; notificationPreference: StudentTaskNotification }

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
    reminderDate: task.reminder_start_at ? task.reminder_start_at.slice(0, 10) : '',
    reminderTime: task.reminder_start_at ? task.reminder_start_at.slice(11, 16) : '',
    repeatType: task.repeat_type,
    recurrenceDays: task.recurrence_days,
    notificationPreference: task.notification_preference,
  }
}

function emptyForm(): FormState {
  return { title: '', note: '', date: todayValue(), time: '09:00', reminderDate: '', reminderTime: '', repeatType: 'one_time', recurrenceDays: [], notificationPreference: 'dashboard_only' }
}

function dueInputValue(form: FormState) {
  return new Date(`${form.date}T${form.time || '09:00'}`).toISOString()
}

function reminderInputValue(form: FormState) {
  return form.reminderDate && form.reminderTime ? new Date(`${form.reminderDate}T${form.reminderTime}`).toISOString() : null
}

function formatDue(task: StudentTask) {
  return getStudentTaskDueAt(task).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function statusStyle(status: string, S: StyleApi) {
  if (status === 'Upcoming') return S.badge('#64748b', '#f1f5f9')
  if (status === 'Snoozed') return S.badge('#92400e', '#fef3c7')
  if (status === 'Overdue') return S.badge('#9f1239', '#fee2e2')
  if (status === 'Done') return S.badge('#166534', '#dcfce7')
  return S.badge('#1d4ed8', '#dbeafe')
}

function statusIcon(status: string) {
  if (status === 'Upcoming') return '🕒'
  if (status === 'Snoozed') return '💤'
  if (status === 'Overdue') return '⚠️'
  if (status === 'Done') return '✅'
  return '🔔'
}

const REPEAT_LABELS: Record<StudentTaskRepeat, string> = {
  one_time: '',
  daily_until_done: 'Daily until done',
  every_day: 'Every day',
  weekdays: 'Weekdays',
  specific_days: 'Specific days',
}

function isRecurring(task: StudentTask) {
  return task.repeat_type !== 'one_time'
}

function isDailyStyleTask(task: StudentTask) {
  return task.repeat_type === 'daily_until_done' || task.repeat_type === 'every_day' || task.repeat_type === 'weekdays'
}

function repeatBadgeStyle(task: StudentTask): Record<string, string | number> {
  const base = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.02em' }
  if (isDailyStyleTask(task)) return { ...base, background: '#ede9fe', color: '#5b21b6' }
  return { ...base, background: '#e0f2fe', color: '#0369a1' }
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ fontSize: 11, color: '#64748b' }}>Start reminding date<input type="date" value={form.reminderDate} onChange={e => setForm({ ...form, reminderDate: e.target.value })} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px', border: '1px solid #dbe4ef', borderRadius: 7 }} /></label>
          <label style={{ fontSize: 11, color: '#64748b' }}>Start reminding time<input type="time" value={form.reminderTime} onChange={e => setForm({ ...form, reminderTime: e.target.value })} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px', border: '1px solid #dbe4ef', borderRadius: 7 }} /></label>
        </div>
        <label style={{ fontSize: 11, color: '#64748b' }}>Repeat<select value={form.repeatType} onChange={e => setForm({ ...form, repeatType: e.target.value as StudentTaskRepeat })} style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px', border: '1px solid #dbe4ef', borderRadius: 7, background: '#fff' }}><option value="one_time">One time</option><option value="daily_until_done">Daily until done</option><option value="every_day">Every day</option><option value="weekdays">Weekdays only</option><option value="specific_days">Specific days</option></select></label>
        {form.repeatType === 'specific_days' && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => <button key={day} type="button" onClick={() => setForm({ ...form, recurrenceDays: form.recurrenceDays.includes(index) ? form.recurrenceDays.filter(item => item !== index) : [...form.recurrenceDays, index].sort() })} style={{ padding: '5px 8px', border: '1px solid #dbe4ef', borderRadius: 6, background: form.recurrenceDays.includes(index) ? '#dbeafe' : '#fff', cursor: 'pointer', fontSize: 11 }}>{day}</button>)}</div>}
        <label style={{ fontSize: 11, color: '#64748b' }}>Notifications<select value={form.notificationPreference} onChange={e => setForm({ ...form, notificationPreference: e.target.value as StudentTaskNotification })} style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px', border: '1px solid #dbe4ef', borderRadius: 7, background: '#fff' }}><option value="dashboard_only">Dashboard only</option><option value="email">Email (coming later)</option><option value="text">Text (coming later)</option><option value="email_text">Email + Text (coming later)</option></select></label>
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
  const [nextOccurrenceNote, setNextOccurrenceNote] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const studentTasks = tasks.filter(task => Number(task.student_id) === Number(studentId))
  const now = new Date()

  async function saveTask() {
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const updated = editingId
        ? await updateStudentTask(editingId, { title: form.title, note: form.note, due_at: dueInputValue(form), reminder_start_at: reminderInputValue(form), repeat_type: form.repeatType, recurrence_days: form.recurrenceDays, notification_preference: form.notificationPreference })
        : await createStudentTask({ studentId: Number(studentId), title: form.title, note: form.note, dueAt: dueInputValue(form), reminderStartAt: reminderInputValue(form), repeatType: form.repeatType, recurrenceDays: form.recurrenceDays, notificationPreference: form.notificationPreference, createdBy: userName || 'Staff' })
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
      if (!done) {
        const updated = await updateStudentTask(task.id, { completed_at: null, completed_by: null })
        setTasks(previous => previous.map(item => item.id === updated.id ? updated : item))
        setNextOccurrenceNote('')
        return
      }
      const result = await completeStudentTask(task, userName || 'Staff')
      setTasks(previous => [...previous.map(item => item.id === result.completed.id ? result.completed : item), ...(result.next ? [result.next] : [])])
      setNextOccurrenceNote(result.next ? `“${task.title}” is done. Next occurrence: ${formatDue(result.next)}.` : '')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update task.')
    }
  }

  async function snooze(task: StudentTask, minutes: number) {
    try {
      const updated = await snoozeStudentTask(task, new Date(Date.now() + minutes * 60000).toISOString(), userName || 'Staff')
      setTasks(previous => previous.map(item => item.id === updated.id ? updated : item))
    } catch (snoozeError) {
      setError(snoozeError instanceof Error ? snoozeError.message : 'Unable to snooze task.')
    }
  }

  async function snoozeTomorrow(task: StudentTask) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    try {
      const updated = await snoozeStudentTask(task, tomorrow.toISOString(), userName || 'Staff')
      setTasks(previous => previous.map(item => item.id === updated.id ? updated : item))
    } catch (snoozeError) {
      setError(snoozeError instanceof Error ? snoozeError.message : 'Unable to snooze task.')
    }
  }

  async function snoozeCustom(task: StudentTask) {
    const value = window.prompt('Snooze until (YYYY-MM-DDTHH:MM)', '')
    if (!value) return
    const until = new Date(value)
    if (Number.isNaN(until.getTime())) {
      setError('Enter a valid snooze date and time.')
      return
    }
    try {
      const updated = await snoozeStudentTask(task, until.toISOString(), userName || 'Staff')
      setTasks(previous => previous.map(item => item.id === updated.id ? updated : item))
    } catch (snoozeError) {
      setError(snoozeError instanceof Error ? snoozeError.message : 'Unable to snooze task.')
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

  const activeTasks = studentTasks
    .filter(task => !task.completed_at)
    .sort((a, b) => getStudentTaskDueAt(a).getTime() - getStudentTaskDueAt(b).getTime())
  const historyTasks = studentTasks
    .filter(task => task.completed_at)
    .sort((a, b) => new Date(b.completed_at as string).getTime() - new Date(a.completed_at as string).getTime())

  function renderTaskRow(task: StudentTask) {
    const status = getStudentTaskStatus(task, now)
    const recurring = isRecurring(task)
    return (
      <div key={task.id} style={{ borderTop: '1px solid #eef2f6', padding: '12px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <input type="checkbox" checked={status === 'Done'} onChange={() => setDone(task, status !== 'Done')} title={status === 'Done' ? 'Reopen task' : 'Mark task done'} style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 13, textDecoration: status === 'Done' ? 'line-through' : 'none' }}>{task.title}</strong>
            <span style={statusStyle(status, S)}>{statusIcon(status)} {status}</span>
            {recurring && <span style={repeatBadgeStyle(task)}>🔁 {REPEAT_LABELS[task.repeat_type]}</span>}
          </div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
            <strong style={{ color: '#334155' }}>Due:</strong> {formatDue(task)}
            {task.reminder_start_at && <> · <strong style={{ color: '#334155' }}>Start reminding:</strong> {new Date(task.reminder_start_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</>}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 3 }}>Created by {task.created_by} on {new Date(task.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
          {task.note && <div style={{ color: '#334155', fontSize: 12, marginTop: 5 }}>{task.note}</div>}
          {status === 'Done' && task.completed_by && <div style={{ color: '#166534', fontSize: 11, marginTop: 4, fontWeight: 700 }}>✅ Completed by {task.completed_by} on {task.completed_at ? new Date(task.completed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</div>}
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 220 }}>
          {status !== 'Done' && <>
            <button onClick={() => snooze(task, 15)} title="Snooze 15 minutes" style={{ padding: '5px 8px', border: '1px solid #fde68a', borderRadius: 6, background: '#fffbeb', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>💤 15m</button>
            <button onClick={() => snooze(task, 60)} title="Snooze 1 hour" style={{ padding: '5px 8px', border: '1px solid #fde68a', borderRadius: 6, background: '#fffbeb', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>💤 1h</button>
            <button onClick={() => snooze(task, 180)} title="Snooze 3 hours" style={{ padding: '5px 8px', border: '1px solid #fde68a', borderRadius: 6, background: '#fffbeb', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>💤 3h</button>
            <button onClick={() => snoozeTomorrow(task)} title="Snooze until tomorrow morning" style={{ padding: '5px 8px', border: '1px solid #fde68a', borderRadius: 6, background: '#fffbeb', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>💤 Tomorrow</button>
            <button onClick={() => snoozeCustom(task)} title="Choose a custom snooze time" style={{ padding: '5px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11 }}>Custom…</button>
          </>}
          <button onClick={() => { setEditingId(task.id); setForm(taskToForm(task)); setError('') }} style={{ padding: '5px 8px', border: '1px solid #dbe4ef', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11 }}>Edit</button>
          <button onClick={() => removeTask(task)} style={{ padding: '5px 8px', border: '1px solid #fecdd3', borderRadius: 6, background: '#fff7f7', color: '#9f1239', cursor: 'pointer', fontSize: 11 }}>Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...S.card, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: form ? 12 : 0 }}>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>Reminders / Tasks</div><div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>Active reminders stay here until marked Done. Completed ones move to history below.</div></div>
          {!form && <button onClick={() => { setEditingId(null); setForm(emptyForm()); setError(''); setNextOccurrenceNote('') }} style={S.btn('primary')}>Add task</button>}
        </div>
        {form && <TaskForm form={form} setForm={setForm} onSave={saveTask} onCancel={() => { setForm(null); setEditingId(null) }} saving={saving} />}
        {error && <div style={{ color: '#9f1239', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {nextOccurrenceNote && <div style={{ color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>🔁 {nextOccurrenceNote}</div>}
        {activeTasks.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, paddingTop: 14 }}>No active reminders or tasks.</div>}
        {activeTasks.map(renderTaskRow)}

        {historyTasks.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '2px solid #eef2f6' }}>
            <button onClick={() => setShowHistory(v => !v)} style={{ padding: '5px 10px', border: '1px solid #dbe4ef', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#475569' }}>
              {showHistory ? '▾' : '▸'} History ({historyTasks.length} completed)
            </button>
            {showHistory && historyTasks.map(renderTaskRow)}
          </div>
        )}
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
    { label: 'Needs Attention', tasks: openTasks.filter(task => getStudentTaskStatus(task, now) === 'Due') },
    { label: 'Overdue', tasks: openTasks.filter(task => getStudentTaskStatus(task, now) === 'Overdue') },
    { label: 'Snoozed', tasks: openTasks.filter(task => getStudentTaskStatus(task, now) === 'Snoozed') },
    { label: 'Later Today', tasks: openTasks.filter(task => getStudentTaskStatus(task, now) === 'Upcoming' && getStudentTaskDueAt(task).toDateString() === now.toDateString() && getStudentTaskDueAt(task).getTime() <= todayLimit) },
    { label: 'Upcoming', tasks: openTasks.filter(task => ['Upcoming', 'Due'].includes(getStudentTaskStatus(task, now)) && getStudentTaskDueAt(task).toDateString() !== now.toDateString()) },
  ]
  const visibleGroups = groups.map(group => ({ ...group, tasks: group.tasks.slice().sort((a, b) => getStudentTaskDueAt(a).getTime() - getStudentTaskDueAt(b).getTime()).slice(0, 5) })).filter(group => group.tasks.length > 0)
  const groupIcon: Record<string, string> = { 'Needs Attention': '🔔', Overdue: '⚠️', Snoozed: '💤', 'Later Today': '🕒', Upcoming: '📅' }

  return <div style={{ ...S.card, borderRadius: 12, padding: 20, marginBottom: 20 }}>
    <div style={{ marginBottom: 14 }}><div style={{ fontSize: 17, color: '#102a43', fontWeight: 800 }}>Reminders / Tasks</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Student tasks that still need attention</div></div>
    {visibleGroups.length === 0 && <div style={{ color: '#64748b', fontSize: 13 }}>No open student tasks.</div>}
    {visibleGroups.map(group => <div key={group.label} style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 800, color: group.label === 'Overdue' ? '#9f1239' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{groupIcon[group.label]} {group.label}</div>{group.tasks.map(task => { const student = studentById.get(Number(task.student_id)); return <button key={task.id} onClick={() => student && openStudent(student, 'tasks')} style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', border: 'none', borderTop: '1px solid #eef2f6', background: 'transparent', cursor: 'pointer' }}><span style={{ minWidth: 0 }}><strong style={{ display: 'block', color: '#263241', fontSize: 12 }}>{student?.name || 'Student'} · {task.title}{isRecurring(task) ? ' 🔁' : ''}</strong><span style={{ color: '#64748b', fontSize: 11 }}>{formatDue(task)}</span></span><span style={statusStyle(getStudentTaskStatus(task, now), S)}>{statusIcon(getStudentTaskStatus(task, now))} {getStudentTaskStatus(task, now)}</span></button> })}</div>)}
  </div>
}

