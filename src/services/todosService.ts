import { supabase } from '../supabaseClient'

export type Todo = {
  id: number
  date: string
  time: string
  text: string
  category: string
  done: boolean
  created_at?: string
  updated_at?: string
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
}): Promise<Todo> {
  const normalizedText = String(input.text || '').trim()
  const normalizedCategory = String(input.category || 'general').trim().toLowerCase() || 'general'
  const normalizedDate = String(input.date || '').trim() || new Date().toISOString().slice(0, 10)

  if (!normalizedText) {
    throw new Error('Todo text is required.')
  }

  const { data, error } = await supabase
    .from('todos')
    .insert([
      {
        date: normalizedDate,
        time: input.time || null,
        text: normalizedText,
        category: normalizedCategory,
        done: false,
      }
    ])
    .select('*')
    .single()

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

  const { data, error } = await supabase
    .from('todos')
    .update({
      ...(normalizedDate !== undefined && { date: normalizedDate }),
      ...(updates.time !== undefined && { time: updates.time || null }),
      ...(normalizedText !== undefined && { text: normalizedText }),
      ...(normalizedCategory !== undefined && { category: normalizedCategory }),
      ...(updates.done !== undefined && { done: updates.done }),
    })
    .eq('id', id)
    .select('*')
    .single()

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
