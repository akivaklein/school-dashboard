import { describe, expect, it } from 'vitest'
import { mergeStudentNoteEntries, mergeSupportSessionEntries } from '../realtimePersistence'

describe('realtime persistence helpers', () => {
  it('dedupes student notes by id and preserves existing entries', () => {
    const existing = [{ id: 1, date: '2026-07-31', author: 'Teacher', text: 'First note' }]
    const next = mergeStudentNoteEntries(existing, { id: 1, date: '2026-07-31', author: 'Teacher', text: 'First note' })
    expect(next).toHaveLength(1)

    const appended = mergeStudentNoteEntries(existing, { id: 2, date: '2026-07-31', author: 'Admin', text: 'Second note' })
    expect(appended).toHaveLength(2)
    expect(appended[0]).toMatchObject({ id: 2, text: 'Second note' })
  })

  it('upserts support sessions and removes them on delete', () => {
    const existing = [{ id: 10, student_name: 'Ari', service_type: 'Therapy' }]
    const inserted = mergeSupportSessionEntries(existing, { id: 11, student_name: 'Beny', service_type: 'Speech' })
    expect(inserted).toHaveLength(2)
    expect(inserted[0]).toMatchObject({ id: 11 })

    const updated = mergeSupportSessionEntries(inserted, { id: 11, student_name: 'Beny', service_type: 'OT' })
    expect(updated).toHaveLength(2)
    expect(updated[0]).toMatchObject({ id: 11, service_type: 'OT' })

    const deleted = mergeSupportSessionEntries(updated, { id: 11, student_name: 'Beny', service_type: 'OT' }, 'DELETE')
    expect(deleted).toHaveLength(1)
    expect(deleted[0]).toMatchObject({ id: 10 })
  })
})
