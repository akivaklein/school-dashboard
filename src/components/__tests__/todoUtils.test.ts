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
})
