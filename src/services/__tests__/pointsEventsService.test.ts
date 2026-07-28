import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyPointsEventTx, reversePointsEventTx } from '../pointsEventsService'
import { supabase } from '../../supabaseClient'

describe('points RPC wrapper contract validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('throws a contract error when apply_points_event_tx omits required fields', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: {
        event_id: 10,
        student_id: 5,
        next_points: 42,
      },
      error: null,
    } as never)

    await expect(
      applyPointsEventTx({
        studentId: 5,
        staffName: 'Tester',
        pointsDelta: 2,
        eventType: 'adjustment',
        category: 'admin',
        reason: 'Test',
      })
    ).rejects.toThrow('Contract error from apply_points_event_tx: required field next_reminders is missing or invalid.')
  })

  it('throws a contract error when reverse_points_event_tx has invalid numeric fields', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: {
        reversal_event_id: 33,
        target_event_id: 11,
        student_id: 5,
        next_points: 50,
        next_reminders: 'bad-value',
      },
      error: null,
    } as never)

    await expect(
      reversePointsEventTx({
        targetEventId: 11,
        staffName: 'Tester',
      })
    ).rejects.toThrow('Contract error from reverse_points_event_tx: required field next_reminders is missing or invalid.')
  })
})
