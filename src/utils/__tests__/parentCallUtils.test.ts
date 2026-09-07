import { describe, expect, it } from 'vitest'
import { getCompletedParentCalls, getOpenParentCalls, removeParentCall } from '../parentCallUtils'

describe('parent call history rules', () => {
  const openCall = { id: 'open', outcome: 'Call Needed', reason: 'Attendance concern', staff: 'Rabbi A' }
  const completedCall = { id: 'done', outcome: 'Spoke', completed: true, completedBy: 'Rabbi B', notes: 'Discussed support.' }

  it('keeps completed calls out of open calls while preserving them in history', () => {
    expect(getOpenParentCalls([openCall, completedCall])).toEqual([openCall])
    expect(getCompletedParentCalls([openCall, completedCall])).toEqual([completedCall])
  })

  it('matches the Dashboard count rule: one student counts once for open calls only', () => {
    const students = [
      { parentCalls: [openCall] },
      { parentCalls: [completedCall] },
      { parentCalls: [{ id: 'deleted', outcome: 'Call Needed', deleted: true }] },
    ]
    const studentsWithOpenCalls = students.filter(student => getOpenParentCalls(student.parentCalls).length > 0)

    expect(studentsWithOpenCalls).toHaveLength(1)
    expect(getOpenParentCalls(students[2].parentCalls)).toEqual([])
  })

  it('removes only the confirmed record from the existing call array', () => {
    expect(removeParentCall([openCall, completedCall], 1)).toEqual([openCall])
  })
})