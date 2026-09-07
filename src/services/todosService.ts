import { supabase } from '../supabaseClient'

export type Todo = {
  id: number
  date: string
  time: string
  text: string
  category: string
  done: boolean
  student_id?: number | null
  priority?: string
  created_at?: string
  updated_at?: string
}

function isMissingTodoColumnError(error: { message?: string } | null | undefined) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('column') || message.includes('schema cache') || message.includes('does not exist')
}

/**
 * Fetch all todos, ordered by date (newest first) and time
 */
export async function listTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: true })

  if (error) {
    console.error('Error fetching todos:', error)
    throw new Error(error.message || 'Unable to fetch todos')
  }

  return (data || []).map(row => ({
    id: row.id,
    date: row.date,
    time: row.time || '',
    text: row.text,
    category: row.category,
    done: row.done,
    student_id: row.student_id == null ? null : Number(row.student_id),
    priority: String(row.priority || 'normal'),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

/**
 * Create a new todo
 */
export async function createTodo(input: {
  date: string
  time: string
  text: string
  category: string
  studentId?: number | null
  priority?: string
}): Promise<Todo> {
  const normalizedText = String(input.text || '').trim()
  const normalizedCategory = String(input.category || 'general').trim().toLowerCase() || 'general'
  const normalizedDate = String(input.date || '').trim() || new Date().toISOString().slice(0, 10)

  if (!normalizedText) {
    throw new Error('Todo text is required.')
  }

  const payload = {
    date: normalizedDate,
    time: input.time || null,
    text: normalizedText,
    category: normalizedCategory,
    done: false,
    student_id: input.studentId || null,
    priority: input.priority || 'normal',
  }

  const primary = await supabase
    .from('todos')
    .insert([payload])
    .select('*')
    .single()

  let data = primary.data
  let error = primary.error

  if (error && isMissingTodoColumnError(error)) {
    const fallback = await supabase
      .from('todos')
      .insert([{ date: normalizedDate, time: input.time || null, text: normalizedText, category: normalizedCategory, done: false }])
      .select('*')
      .single()
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('Error creating todo:', error)
    throw new Error(error.message || 'Unable to create todo')
  }

  return {
    id: data.id,
    date: data.date,
    time: data.time || '',
    text: normalizedText,
    category: normalizedCategory,
    done: data.done,
    student_id: data.student_id == null ? input.studentId || null : Number(data.student_id),
    priority: String(data.priority || input.priority || 'normal'),
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/**
 * Update a todo (mark as done, modify text, etc.)
 */
export async function updateTodo(
  id: number,
  updates: Partial<Omit<Todo, 'id' | 'created_at' | 'updated_at'>>
): Promise<Todo> {
  const normalizedText = updates.text !== undefined ? String(updates.text || '').trim() : undefined
  const normalizedCategory = updates.category !== undefined ? String(updates.category || 'general').trim().toLowerCase() || 'general' : undefined
  const normalizedDate = updates.date !== undefined ? String(updates.date || '').trim() || new Date().toISOString().slice(0, 10) : undefined

  const payload = {
    ...(normalizedDate !== undefined && { date: normalizedDate }),
    ...(updates.time !== undefined && { time: updates.time || null }),
    ...(normalizedText !== undefined && { text: normalizedText }),
    ...(normalizedCategory !== undefined && { category: normalizedCategory }),
    ...(updates.done !== undefined && { done: updates.done }),
    ...(updates.student_id !== undefined && { student_id: updates.student_id || null }),
    ...(updates.priority !== undefined && { priority: updates.priority || 'normal' }),
  }

  const primary = await supabase
    .from('todos')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  let data = primary.data
  let error = primary.error

  if (error && isMissingTodoColumnError(error)) {
    const fallbackPayload = { ...payload }
    delete fallbackPayload.student_id
    delete fallbackPayload.priority
    const fallback = await supabase
      .from('todos')
      .update(fallbackPayload)
      .eq('id', id)
      .select('*')
      .single()
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('Error updating todo:', error)
    throw new Error(error.message || 'Unable to update todo')
  }

  return {
    id: data.id,
    date: data.date,
    time: data.time || '',
    text: data.text,
    category: data.category,
    done: data.done,
    student_id: data.student_id == null ? updates.student_id || null : Number(data.student_id),
    priority: String(data.priority || updates.priority || 'normal'),
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/**
 * Delete a todo
 */
export async function deleteTodo(id: number): Promise<void> {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting todo:', error)
    throw new Error(error.message || 'Unable to delete todo')
  }
}
