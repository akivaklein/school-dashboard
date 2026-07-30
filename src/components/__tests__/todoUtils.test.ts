import { describe, expect, it } from 'vitest'
import { groupTodosByStatus } from '../todoUtils'

describe('groupTodosByStatus', () => {
  it('groups pending and completed tasks for display', () => {
    const grouped = groupTodosByStatus([
      { id: 1, text: 'Call family', done: false, date: '2026-07-30', time: '10:00', category: 'call' },
      { id: 2, text: 'Review notes', done: true, date: '2026-07-30', time: '', category: 'general' },
    ])

    expect(grouped).toEqual({
      pending: [{ id: 1, text: 'Call family', done: false, date: '2026-07-30', time: '10:00', category: 'call' }],
      completed: [{ id: 2, text: 'Review notes', done: true, date: '2026-07-30', time: '', category: 'general' }],
    })
  })

  it('sorts tasks by date and time within each status group', () => {
    const grouped = groupTodosByStatus([
      { id: 1, text: 'Later item', done: false, date: '2026-07-31', time: '11:00', category: 'general' },
      { id: 2, text: 'Earlier item', done: false, date: '2026-07-30', time: '09:00', category: 'call' },
      { id: 3, text: 'Completed later', done: true, date: '2026-07-31', time: '08:00', category: 'meeting' },
      { id: 4, text: 'Completed earlier', done: true, date: '2026-07-30', time: '10:30', category: 'announcement' },
    ])

    expect(grouped.pending.map(todo => todo.id)).toEqual([1, 2])
    expect(grouped.completed.map(todo => todo.id)).toEqual([3, 4])
  })
})
