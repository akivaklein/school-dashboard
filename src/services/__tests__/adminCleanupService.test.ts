import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { clearGradesHistory, clearPointsHistory } from '../adminCleanupService'

function tableMock(overrides: Record<string, unknown>) {
  return {
    delete: vi.fn().mockReturnValue({ not: vi.fn().mockResolvedValue({ error: null }) }),
    update: vi.fn().mockReturnValue({ not: vi.fn().mockResolvedValue({ error: null }) }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  }
}

describe('adminCleanupService', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('clears grade_entries, resets test_scores, and logs an audit entry — never touches students table rows by id', async () => {
    const gradeEntriesTable = tableMock({})
    const studentsTable = tableMock({})
    const auditLogsTable = tableMock({})
    fromMock.mockImplementation((table: string) => {
      if (table === 'grade_entries') return gradeEntriesTable
      if (table === 'students') return studentsTable
      if (table === 'audit_logs') return auditLogsTable
      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await clearGradesHistory('Admin User')

    expect(result.success).toBe(true)
    expect(gradeEntriesTable.delete).toHaveBeenCalled()
    expect(studentsTable.update).toHaveBeenCalledWith({ test_scores: [] })
    expect(auditLogsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin_clear_grades_history', user_name: 'Admin User' }),
    )
  })

  it('clears points_events, unlinks store_redemptions FKs, and resets token_balance/reminders/behavior_log', async () => {
    const storeRedemptionsTable = tableMock({})
    const pointsEventsTable = tableMock({})
    const studentsTable = tableMock({})
    const auditLogsTable = tableMock({})
    fromMock.mockImplementation((table: string) => {
      if (table === 'store_redemptions') return storeRedemptionsTable
      if (table === 'points_events') return pointsEventsTable
      if (table === 'students') return studentsTable
      if (table === 'audit_logs') return auditLogsTable
      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await clearPointsHistory('Admin User')

    expect(result.success).toBe(true)
    expect(storeRedemptionsTable.update).toHaveBeenCalledWith({ points_event_id: null, reversal_event_id: null })
    expect(pointsEventsTable.update).toHaveBeenCalledWith({ related_event_id: null })
    expect(pointsEventsTable.delete).toHaveBeenCalled()
    expect(studentsTable.update).toHaveBeenCalledWith({ token_balance: 0, reminders: 0, behavior_log: [] })
    expect(auditLogsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin_clear_points_history', user_name: 'Admin User' }),
    )
  })

  it('returns a failure result instead of throwing when a delete errors', async () => {
    const gradeEntriesTable = tableMock({
      delete: vi.fn().mockReturnValue({ not: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) }),
    })
    fromMock.mockImplementation((table: string) => {
      if (table === 'grade_entries') return gradeEntriesTable
      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await clearGradesHistory('Admin User')

    expect(result).toEqual({ success: false, error: 'boom' })
  })
})
