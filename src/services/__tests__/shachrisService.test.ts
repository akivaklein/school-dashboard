import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }))
vi.mock('../../supabaseClient', () => ({ supabase: mocks }))
import { correctShachrisStart, endShachrisLiveSession, loadShachrisDayAudit, loadShachrisHistory, loadShachrisWeeklyDecisions, reopenShachrisLiveSession, saveShachrisHistoricalDay, saveShachrisWeeklyDecision, undoShachrisArrival } from '../shachrisService'

describe('read-only Shachris history', () => {
  beforeEach(() => vi.resetAllMocks())

  it('reopens the same session through its own confirmed, expected-end guarded RPC', async () => {
    const session = { id: 'today', started_at: '2026-10-13T07:00:00Z', milestone_times: { 'first-live-session-ended': '2026-10-13T08:00:00Z' } }
    mocks.rpc.mockResolvedValue({ data: session, error: null })
    expect(await reopenShachrisLiveSession({ sessionId: 'today', expectedEnd: '2026-10-13T08:00:00Z', reason: ' Missed completion ', actorName: 'Editor', confirmed: true })).toEqual(session)
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('shachris_reopen_live_session', { p_session_id: 'today', p_expected_end: '2026-10-13T08:00:00Z', p_reason: 'Missed completion', p_actor_name: 'Editor', p_confirmed: true })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('rejects reopening without a reason or confirmation before any write', async () => {
    for (const [reason, confirmed] of [[' ', true], ['Missed completion', false]] as const) {
      await expect(reopenShachrisLiveSession({ sessionId: 'today', expectedEnd: 'end', reason, confirmed, actorName: 'Editor' })).rejects.toThrow('Confirm reopening')
    }
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it.each(['Only today official started session can be reopened', 'Session end changed. Reload before reopening.', 'Shachris editing denied'])('surfaces reopen safety rejection: %s', async message => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message } })
    await expect(reopenShachrisLiveSession({ sessionId: 'today', expectedEnd: 'end', reason: 'Missed completion', confirmed: true, actorName: 'Editor' })).rejects.toEqual({ message })
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it.each(['eligible', 'not_eligible', 'clear'] as const)('appends a %s weekly decision without writing attendance facts', async decision => {
    mocks.rpc.mockResolvedValue({ data: { id: 'new', decision }, error: null })
    await saveShachrisWeeklyDecision({ weekStart: '2020-01-05', studentId: 1, decision, expectedId: 'previous', reason: ' Reviewed facts ', actorName: 'Editor' })
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('shachris_save_weekly_decision', { p_week_start: '2020-01-05', p_student_id: 1, p_decision: decision, p_expected_id: 'previous', p_reason: 'Reviewed facts', p_actor_name: 'Editor' })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('rejects a blank weekly reason and surfaces stale decisions without attendance fallback', async () => {
    const input = { weekStart: '2020-01-05', studentId: 1, decision: 'eligible' as const, expectedId: null, reason: ' ', actorName: 'Editor' }
    await expect(saveShachrisWeeklyDecision(input)).rejects.toThrow('decision reason')
    expect(mocks.rpc).not.toHaveBeenCalled()
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Decision changed. Reload before saving.' } })
    await expect(saveShachrisWeeklyDecision({ ...input, reason: 'Reviewed' })).rejects.toEqual({ message: 'Decision changed. Reload before saving.' })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('loads ordered weekly decision history for only the requested week and roster', async () => {
    const query = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), order: vi.fn() }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.in.mockReturnValue(query)
    query.order.mockResolvedValue({ data: [{ id: 'latest' }, { id: 'previous' }], error: null })
    mocks.from.mockReturnValue(query)
    expect(await loadShachrisWeeklyDecisions('2020-01-05', [1, 2])).toHaveLength(2)
    expect(mocks.from).toHaveBeenCalledWith('shachris_weekly_decisions')
    expect(query.eq).toHaveBeenCalledWith('week_start', '2020-01-05')
    expect(query.in).toHaveBeenCalledWith('student_id', [1, 2])
    expect(query.order).toHaveBeenCalledWith('sequence', { ascending: false })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('uses a revision-checked audited RPC for arrival undo, never a departure or generic save', async () => {
    const record = { student_id: 1, presence: 'unmarked', arrival_at: null, revision: 4, note: 'Kept note' }
    mocks.rpc.mockResolvedValue({ data: record, error: null })
    expect(await undoShachrisArrival({ sessionId: 'today', studentId: 1, revision: 3, reason: ' Accidental tap ', actorName: 'Editor', confirmed: true })).toEqual(record)
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('shachris_undo_arrival', {
      p_session_id: 'today', p_student_id: 1, p_revision: 3, p_reason: 'Accidental tap', p_actor_name: 'Editor', p_confirmed: true,
    })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('surfaces an unsafe/stale arrival undo instead of falling back to destructive writes', async () => {
    const error = { message: 'Later attendance/completion facts exist.' }
    mocks.rpc.mockResolvedValue({ data: null, error })
    await expect(undoShachrisArrival({ sessionId: 'today', studentId: 1, revision: 3, reason: 'Accidental tap', actorName: 'Editor', confirmed: true })).rejects.toEqual(error)
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('includes audited arrival corrections in the existing student day history', async () => {
    const audit = [{ id: 'undo', detail: { action: 'undo-arrival', reason: 'Accidental tap' } }]
    const query = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), order: vi.fn() }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.in.mockReturnValue(query)
    query.order.mockReturnValueOnce(query).mockResolvedValueOnce({ data: audit, error: null })
    mocks.from.mockReturnValue(query)
    expect(await loadShachrisDayAudit('today', 1)).toEqual(audit)
    expect(mocks.from).toHaveBeenCalledWith('shachris_events')
    expect(query.eq.mock.calls).toEqual([['session_id', 'today'], ['student_id', 1]])
    expect(query.in).toHaveBeenCalledWith('event_type', ['historical-day-edit', 'arrival-correction'])
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('ends live timing through a separate RPC without marking a communal milestone', async () => {
    const session = { id: 'today', milestone_times: { 'live-session-ended': '2026-10-11T08:00:00Z' } }
    mocks.rpc.mockResolvedValue({ data: session, error: null })
    expect(await endShachrisLiveSession('today', 'Editor')).toEqual(session)
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('shachris_end_live_session', { p_session_id: 'today', p_actor_name: 'Editor' })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  function sessionsQuery(data: unknown[], error: unknown = null) {
    const query = { select: vi.fn(), gte: vi.fn(), lte: vi.fn(), is: vi.fn(), order: vi.fn().mockResolvedValue({ data, error }) }
    query.select.mockReturnValue(query)
    query.gte.mockReturnValue(query)
    query.lte.mockReturnValue(query)
    query.is.mockReturnValue(query)
    mocks.from.mockReturnValueOnce(query)
    return query
  }

  it('selects only the requested week and roster, never calling an RPC', async () => {
    const sessions = [{ id: 'saved', session_date: '2026-10-05' }]
    const records = [{ session_id: 'saved', student_id: 1 }]
    const sessionQuery = sessionsQuery(sessions)
    const studentFilter = vi.fn().mockResolvedValue({ data: records, error: null })
    const sessionFilter = vi.fn().mockReturnValue({ in: studentFilter })
    mocks.from.mockReturnValueOnce({ select: vi.fn().mockReturnValue({ in: sessionFilter }) })
    expect(await loadShachrisHistory('2026-10-04', '2026-10-09', [1])).toEqual({ sessions, records })
    expect(sessionQuery.gte).toHaveBeenCalledWith('session_date', '2026-10-04')
    expect(sessionQuery.lte).toHaveBeenCalledWith('session_date', '2026-10-09')
    expect(sessionQuery.is).toHaveBeenCalledWith('voided_at', null)
    expect(sessionFilter).toHaveBeenCalledWith('session_id', ['saved'])
    expect(studentFilter).toHaveBeenCalledWith('student_id', [1])
    expect(mocks.from.mock.calls).toEqual([['shachris_sessions'], ['shachris_student_records']])
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('returns an empty week without creating sessions or student records', async () => {
    sessionsQuery([])
    expect(await loadShachrisHistory('2026-10-04', '2026-10-09', [1])).toEqual({ sessions: [], records: [] })
    expect(mocks.from).toHaveBeenCalledTimes(1)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('does not read unrelated records when the active roster is empty', async () => {
    sessionsQuery([{ id: 'saved' }])
    expect((await loadShachrisHistory('2026-10-04', '2026-10-09', [])).records).toEqual([])
    expect(mocks.from).toHaveBeenCalledTimes(1)
  })

  it('surfaces read failures instead of reporting eligibility from partial history', async () => {
    const error = { message: 'Read denied' }
    sessionsQuery([], error)
    await expect(loadShachrisHistory('2026-10-04', '2026-10-09', [1])).rejects.toEqual(error)
    expect(mocks.from).toHaveBeenCalledTimes(1)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('uses only the explicit audited RPC for historical saves', async () => {
    const result = { status: 'present' as const, onTime: true, stayedRequired: true, lateReason: 'no_reason' as const, lateExcused: false, lateReasonNote: '', note: 'Paper record' }
    mocks.rpc.mockResolvedValue({ data: { session: { id: 'past' }, record: { historical_result: result } }, error: null })
    await saveShachrisHistoricalDay({ date: '2020-01-05', studentId: 1, result, revision: null, reason: ' Paper backfill ', actorName: 'QA' })
    expect(mocks.rpc).toHaveBeenCalledWith('shachris_save_historical_day', { p_date: '2020-01-05', p_student_id: 1, p_result: result, p_revision: null, p_reason: 'Paper backfill', p_actor_name: 'QA' })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('reuses the existing correction RPC for a confirmed today restart, including an unstarted session', async () => {
    mocks.rpc.mockResolvedValue({ data: { session: { id: 'fresh', started_at: null }, records: [] }, error: null })
    await correctShachrisStart({ sessionId: 'old', mode: 'restart', newStart: null, expectedStart: null, reason: ' Restart testing ', actorName: 'Editor', confirmed: true })
    expect(mocks.rpc).toHaveBeenCalledWith('shachris_correct_start', { p_session_id: 'old', p_mode: 'restart', p_new_start: null, p_expected_start: null, p_reason: 'Restart testing', p_actor_name: 'Editor', p_confirmed: true })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('surfaces historical save errors without falling back to live writes', async () => {
    const error = { message: 'Day changed. Reload before saving.' }
    mocks.rpc.mockResolvedValue({ data: null, error })
    await expect(saveShachrisHistoricalDay({ date: '2020-01-05', studentId: 1, result: { status: 'absent', onTime: null, stayedRequired: null, lateReason: 'no_reason', lateExcused: false, lateReasonNote: '', note: '' }, revision: 1, reason: 'Correction', actorName: 'QA' })).rejects.toEqual(error)
    expect(mocks.from).not.toHaveBeenCalled()
  })
})