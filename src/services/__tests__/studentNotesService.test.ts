import { describe, expect, it } from 'vitest'
import { canManageStudentNote } from '../studentNotesService'

describe('canManageStudentNote', () => {
  it('allows admin to manage any note', () => {
    expect(canManageStudentNote({
      role: 'admin',
      actorUserId: 'user-1',
      noteCreatedByUserId: 'user-2',
    })).toBe(true)
  })

  it('allows author to manage own note', () => {
    expect(canManageStudentNote({
      role: 'teacher',
      actorUserId: 'user-7',
      noteCreatedByUserId: 'user-7',
    })).toBe(true)
  })

  it('denies non-admin managing another user note', () => {
    expect(canManageStudentNote({
      role: 'teacher',
      actorUserId: 'user-1',
      noteCreatedByUserId: 'user-2',
    })).toBe(false)
  })

  it('denies when ids are missing for non-admin', () => {
    expect(canManageStudentNote({
      role: 'support_staff',
      actorUserId: null,
      noteCreatedByUserId: 'user-2',
    })).toBe(false)
  })
})
