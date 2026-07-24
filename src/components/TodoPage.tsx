import type { Dispatch, KeyboardEvent, SetStateAction } from 'react'
import { createTodo, updateTodo, deleteTodo } from '../services/todosService'

type TodoItem = {
  id: number
  date: string
  time: string
  text: string
  category: string
  done: boolean
}

type Props = {
  S: any
  todos: TodoItem[]
  setTodos: Dispatch<SetStateAction<TodoItem[]>>
  newTodo: string
  setNewTodo: (value: string) => void
  newTodoCategory: string
  setNewTodoCategory: (value: string) => void
  newTodoTime: string
  setNewTodoTime: (value: string) => void
}

export default function TodoPage({
  S,
  todos,
  setTodos,
  newTodo,
  setNewTodo,
  newTodoCategory,
  setNewTodoCategory,
  newTodoTime,
  setNewTodoTime,
}: Props) {
  const pendingTodos = todos.filter(todo => !todo.done)
  const completedTodos = todos.filter(todo => todo.done)

  const categoryColors: Record<string, [string, string]> = {
    meeting: ['#5b5f7a', '#f5f3ff'],
    call: ['#4b6854', '#dcfce7'],
    announcement: ['#92400e', '#fef3c7'],
    appointment: ['#1d4ed8', '#dbeafe'],
    general: ['#334155', '#f8fafc'],
  }

  async function addTodo() {
    if (!newTodo.trim()) return
    try {
      const created = await createTodo({
        date: new Date().toISOString().slice(0, 10),
        time: newTodoTime,
        text: newTodo,
        category: newTodoCategory,
      })
      setTodos(previous => [...previous, created])
      setNewTodo('')
      setNewTodoTime('')
    } catch (error) {
      console.error('Failed to create todo:', error)
      alert('Unable to save todo. Please try again.')
    }
  }

  async function handleToggleTodo(todo: TodoItem) {
    try {
      const updated = await updateTodo(todo.id, { done: !todo.done })
      setTodos(previous => previous.map(item => 
        item.id === todo.id ? updated : item
      ))
    } catch (error) {
      console.error('Failed to update todo:', error)
      alert('Unable to update todo. Please try again.')
    }
  }

  async function handleDeleteTodo(todo: TodoItem) {
    try {
      await deleteTodo(todo.id)
      setTodos(previous => previous.filter(item => item.id !== todo.id))
    } catch (error) {
      console.error('Failed to delete todo:', error)
      alert('Unable to delete todo. Please try again.')
    }
  }

  function onTaskInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    addTodo()
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>📋 To-Do List</h1>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Add New Task</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={newTodo}
            onChange={event => setNewTodo(event.target.value)}
            placeholder="Task description..."
            onKeyDown={onTaskInputKeyDown}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 13,
              minWidth: 200,
            }}
          />
          <input
            value={newTodoTime}
            onChange={event => setNewTodoTime(event.target.value)}
            placeholder="Time (e.g. 10:30 AM)"
            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, width: 160 }}
          />
          <select
            value={newTodoCategory}
            onChange={event => setNewTodoCategory(event.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
          >
            <option value="general">General</option>
            <option value="meeting">Meeting</option>
            <option value="call">Phone Call</option>
            <option value="announcement">Announcement</option>
            <option value="appointment">Appointment</option>
          </select>
          <button onClick={addTodo} style={S.btn('primary')}>+ Add</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          Pending ({pendingTodos.length})
        </div>

        {pendingTodos.map(todo => {
          const [textColor, backgroundColor] = categoryColors[todo.category] || categoryColors.general
          return (
            <div key={todo.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => handleToggleTodo(todo)}
                style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{todo.text}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>📅 {todo.date}{todo.time ? ` · ${todo.time}` : ''}</span>
                  <span style={S.badge(textColor, backgroundColor)}>{todo.category}</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteTodo(todo)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
          )
        })}

        {pendingTodos.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
            All done! ✅
          </div>
        )}

        {completedTodos.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>
              Completed ({completedTodos.length})
            </div>
            {completedTodos.map(todo => (
              <div key={todo.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', opacity: 0.5 }}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => handleToggleTodo(todo)}
                  style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1, textDecoration: 'line-through', fontSize: 13, color: '#64748b' }}>
                  {todo.text}
                </div>
                <button
                  onClick={() => handleDeleteTodo(todo)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}