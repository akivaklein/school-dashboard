import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createShachrisDemoBackend } from '../../../apps/shachris-demo/src/demoBackend'
import { demoRoster } from '../../../apps/shachris-demo/src/roster'
import { INITIAL_SHACHRIS_CONFIG, localDateKey } from '../../utils/shachris'

const roster = [
  { id: 1, name: 'Demo Eleven', age: 11, classId: 'yk-b' },
  { id: 2, name: 'Demo Twelve', age: 12, classId: 'yk-b' },
  { id: 3, name: 'Demo Thirteen', age: 13, classId: 'yk-a' },
]
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-06T08:00:00Z')) })
afterEach(() => vi.useRealTimers())

describe('standalone Shachris demo boundary', () => {
  it('uses two-minute grace for individual arrivals but exact Hodu time for bulk arrivals', async () => {
    const backend = createShachrisDemoBackend(roster)
    const { session } = await backend.openShachrisSession(localDateKey(), [1, 2, 3])
    const started = await backend.startShachrisSession(session.id, 'Demo')
    vi.advanceTimersByTime(120000)
    const onTime = await backend.recordShachrisPresenceEvent({ sessionId: session.id, studentId: 1, eventType: 'arrival', actorName: 'Demo' })
    expect(onTime.late_minutes).toBe(0)
    expect(onTime.late_reason).toBeNull()
    vi.advanceTimersByTime(1000)
    const late = await backend.recordShachrisPresenceEvent({ sessionId: session.id, studentId: 2, eventType: 'arrival', actorName: 'Demo' })
    expect(late.late_minutes).toBe(2)
    expect(late.late_reason).toBe('no_reason')
    const bulk = await backend.bulkArriveAtShachrisStart(session.id, [3], 'Demo')
    expect(bulk[0].arrival_at).toBe(started.started_at)
  })
  it('allows session editors to correct start and preserves activity during deliberate correction', async () => {
    const backend = createShachrisDemoBackend(roster)
    expect((await backend.loadAccess('teacher')).canCorrectStart).toBe(true)
    const { session } = await backend.openShachrisSession(localDateKey(), [1, 2, 3])
    const started = await backend.startShachrisSession(session.id, 'Teacher')
    expect((await backend.loadShachrisStartCorrectionState(session.id)).hasActivity).toBe(false)
    const reset = await backend.correctShachrisStart({ sessionId: session.id, mode: 'reset', expectedStart: started.started_at!, newStart: null, reason: 'Accidental click', actorName: 'Teacher', confirmed: true })
    expect(reset.session.started_at).toBeNull()
    const next = await backend.startShachrisSession(session.id, 'Admin')
    vi.advanceTimersByTime(480000)
    const arrived = await backend.recordShachrisPresenceEvent({ sessionId: session.id, studentId: 1, eventType: 'arrival', actorName: 'Admin' })
    const input = { sessionId: session.id, mode: 'reset' as const, expectedStart: next.started_at!, newStart: null, reason: 'Testing', actorName: 'Admin', confirmed: true }
    await expect(backend.correctShachrisStart(input)).rejects.toThrow('activity')
    await expect(backend.correctShachrisStart({ ...input, mode: 'correct', newStart: arrived.arrival_at, confirmed: false })).rejects.toThrow('Confirm')
    const corrected = await backend.correctShachrisStart({ ...input, mode: 'correct', newStart: arrived.arrival_at })
    expect(corrected.records[0].arrival_at).toBe(arrived.arrival_at)
    expect(corrected.records[0].late_minutes).toBe(0)
    expect((await backend.loadShachrisStartCorrectionState(session.id)).audit.map(entry => entry.action)).toEqual(['corrected', 'started', 'reset', 'started'])
  })
  it('exports only names, current ages, grade assignments, and local IDs', () => {
    expect(demoRoster).toHaveLength(16)
    for (const student of demoRoster) expect(Object.keys(student).sort()).toEqual(['age', 'classId', 'id', 'name'])
    expect(new Set(demoRoster.map(student => student.id)).size).toBe(16)
  })

  it('starts blank with age rules and only the requested roster', async () => {
    const backend = createShachrisDemoBackend(roster)
    const state = await backend.openShachrisSession(localDateKey(), [1, 3])
    expect(state.records.map(record => record.student_id)).toEqual([1, 3])
    expect(state.records.map(record => record.stay_requirement.requiredUntil)).toEqual(['shemoneh-esrei', 'end-davening'])
    expect(state.records.every(record => record.presence === 'unmarked')).toBe(true)
    expect(state.session.started_at).toBeNull()
    expect(await backend.loadAccess('demo')).toEqual({ canEdit: true, canManage: false, canCorrectStart: true })
  })

  it('requires Hodu and ordered milestones but only personal clearance makes Met', async () => {
    const backend = createShachrisDemoBackend(roster)
    const { session } = await backend.openShachrisSession(localDateKey(), [1, 2, 3])
    await expect(backend.bulkArriveAtShachrisStart(session.id, [1], 'Demo')).rejects.toThrow('Start Hodu')
    await backend.startShachrisSession(session.id, 'Demo')
    await expect(backend.markShachrisMilestone(session.id, 'end-davening', 'Demo')).rejects.toThrow('previous')
    await backend.bulkArriveAtShachrisStart(session.id, [1, 2], 'Demo')
    const result = await backend.markShachrisMilestone(session.id, 'shemoneh-esrei', 'Demo')
    expect(result.metCount).toBe(0)
    expect(result.records[0].requirement_result).toBe('pending')
    const cleared = await backend.confirmShachrisClearance({ sessionId: session.id, studentId: 1, actorName: 'Demo', revision: result.records[0].revision })
    expect(cleared.personally_cleared_at).not.toBeNull()
    vi.advanceTimersByTime(120000)
    const left = await backend.recordShachrisPresenceEvent({ sessionId: session.id, studentId: 1, eventType: 'left', permission: 'with', actorName: 'Demo' })
    expect(left.requirement_result).toBe('met')
    expect(left.presence).toBe('left')
    expect(left.stayed_beyond_required).toBe(true)
    expect(left.extra_stay_intervals?.[0].endedAt).not.toBeNull()
    const returned = await backend.recordShachrisPresenceEvent({ sessionId: session.id, studentId: 1, eventType: 'returned', actorName: 'Demo' })
    expect(returned.leave_intervals[0].returnedAt).not.toBeNull()
    expect((await backend.markShachrisMilestone(session.id, 'shemoneh-esrei', 'Demo')).alreadyMarked).toBe(true)
  })

  it('keeps an out student pending and denies clearance until he returns', async () => {
    const backend = createShachrisDemoBackend(roster)
    const { session } = await backend.openShachrisSession(localDateKey(), [1, 2, 3])
    await backend.startShachrisSession(session.id, 'Demo')
    await backend.bulkArriveAtShachrisStart(session.id, [1, 2, 3], 'Demo')
    await backend.recordShachrisPresenceEvent({ sessionId: session.id, studentId: 1, eventType: 'left', permission: 'without', actorName: 'Demo' })
    const result = await backend.markShachrisMilestone(session.id, 'shemoneh-esrei', 'Demo')
    expect(result.notMetCount).toBe(0)
    expect(result.records[0].requirement_result).toBe('pending')
    await expect(backend.confirmShachrisClearance({ sessionId: session.id, studentId: 1, actorName: 'Demo', revision: result.records[0].revision })).rejects.toThrow('In Shul')
  })

  it('isolates adapter instances and returns detached state', async () => {
    const first = createShachrisDemoBackend(roster)
    const second = createShachrisDemoBackend(roster)
    const { session, records } = await first.openShachrisSession(localDateKey(), [1])
    records[0].presence = 'present'
    expect((await first.openShachrisSession(localDateKey(), [1])).records[0].presence).toBe('unmarked')
    await first.startShachrisSession(session.id, 'Demo')
    expect((await second.openShachrisSession(localDateKey(), [1])).session.started_at).toBeNull()
  })

  it('keeps today-only overrides out of later sessions and retains future overrides', async () => {
    const backend = createShachrisDemoBackend(roster)
    const { session, records } = await backend.openShachrisSession(localDateKey(), [1, 2])
    await backend.saveShachrisStayRequirement({ studentId: 1, mode: 'manual', requiredUntil: 'end-davening', reason: '', actorName: 'Demo', session, revision: records[0].revision, duration: 'today' })
    await backend.saveShachrisStayRequirement({ studentId: 2, mode: 'manual', requiredUntil: 'end-davening', reason: '', actorName: 'Demo', session, revision: records[1].revision, duration: 'future' })
    vi.setSystemTime(new Date('2026-10-07T08:00:00Z'))
    const next = await backend.openShachrisSession(localDateKey(), [1, 2])
    expect(next.records.map(record => record.stay_requirement.requiredUntil)).toEqual(['shemoneh-esrei', 'end-davening'])
  })

  it('rejects stale saves and does not allow settings changes', async () => {
    const backend = createShachrisDemoBackend(roster)
    const { session, records } = await backend.openShachrisSession(localDateKey(), [1])
    await backend.saveShachrisRecords(session.id, [{ ...records[0], rating_id: 'vg' }], 'Demo')
    await expect(backend.saveShachrisRecords(session.id, records, 'Demo')).rejects.toThrow('changed')
    await expect(backend.saveShachrisSettings({ config: INITIAL_SHACHRIS_CONFIG, revision: 0 })).rejects.toThrow('temporary demo')
  })
  it('stores separate nonattendance facts and excused lateness without losing late minutes', async () => {
    const backend = createShachrisDemoBackend(roster)
    const { session } = await backend.openShachrisSession(localDateKey(), [1, 2, 3])
    await backend.startShachrisSession(session.id, 'Demo')
    const absent = await backend.setShachrisAbsence({ sessionId: session.id, studentId: 1, status: 'excused', actorName: 'Demo', revision: 0 })
    expect(absent.absence_status).toBe('excused')
    await backend.bulkArriveAtShachrisStart(session.id, [1, 2], 'Demo')
    expect((await backend.openShachrisSession(localDateKey(), [1])).records[0].presence).toBe('absent')
    vi.advanceTimersByTime(480000)
    const arrival = await backend.recordShachrisPresenceEvent({ sessionId: session.id, studentId: 1, eventType: 'arrival', actorName: 'Demo' })
    expect(arrival.absence_status).toBeNull()
    expect(arrival.late_minutes).toBe(8)
    const excused = await backend.saveShachrisLateReason({ sessionId: session.id, studentId: 1, reason: 'transportation', note: '', excused: true, actorName: 'Demo', revision: arrival.revision })
    expect(excused).toMatchObject({ late_minutes: 8, late_reason: 'transportation', late_excused: true })
    expect((await backend.openShachrisSession(localDateKey(), [1])).records[0]).toEqual(excused)
  })
})