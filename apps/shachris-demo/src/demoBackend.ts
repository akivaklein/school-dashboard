import type { ShachrisBackend } from '../../../src/services/shachrisBackend'
import type { ShachrisSession, ShachrisStartCorrectionState } from '../../../src/services/shachrisService'
import { calculateShachrisMinutesLate, isShachrisLate, personallyClearShachrisRecord, INITIAL_SHACHRIS_CONFIG, latestOpenShachrisLeave, localDateKey, resolveShachrisExpectation, resolveShachrisStayRequirement, type ShachrisAssignment, type ShachrisConfig, type ShachrisRecord, type ShachrisStayAssignment } from '../../../src/utils/shachris'
import type { DemoStudent } from './roster'
import { shachrisGraceMinutes } from '../../../src/utils/shachris'

export function createShachrisDemoBackend(roster: DemoStudent[], initialConfig: ShachrisConfig = INITIAL_SHACHRIS_CONFIG): ShachrisBackend {
  const config = structuredClone(initialConfig)
  const students = new Map(roster.map(student => [student.id, { id: student.id, age: student.age, classId: student.classId }]))
  const sessions = new Map<string, { session: ShachrisSession; records: ShachrisRecord[] }>()
  const progressHistory: ShachrisAssignment[] = []
  const stayHistory: ShachrisStayAssignment[] = []
  const startAudit = new Map<string, ShachrisStartCorrectionState['audit']>()
  const copy = <Value,>(value: Value): Value => structuredClone(value)
  const now = () => new Date().toISOString()
  const applies = (entry: ShachrisAssignment | ShachrisStayAssignment, date: string) => entry.effective_date <= date && (entry.duration === 'future' || entry.effective_date === date)
  function getSession(id: string) {
    const state = sessions.get(id)
    if (!state) throw new Error('Demo session not found.')
    return state
  }
  function getRecord(id: string, studentId: number) {
    const record = getSession(id).records.find(entry => entry.student_id === studentId)
    if (!record) throw new Error('Student not in this demo session.')
    return record
  }
  function requireStarted(id: string) {
    const state = getSession(id)
    if (!state.session.started_at) throw new Error('Start Hodu first.')
    return state
  }
  function changed(record: ShachrisRecord, actorName: string) {
    record.revision++
    record.updated_by_name = actorName
    return copy(record)
  }

  return {
    async loadAccess() { return { canEdit: true, canManage: false, canCorrectStart: true } },
    async loadShachrisSettings() { return { config: copy(config), revision: 0 } },
    async saveShachrisSettings() { throw new Error('Settings are not available in this temporary demo.') },
    async openShachrisSession(date, studentIds) {
      const id = `demo-${date}`
      if (!sessions.has(id)) {
        const session: ShachrisSession = { id, session_date: date, config: copy(config), started_at: null, started_by_name: '', milestone_times: {} }
        const records: ShachrisRecord[] = [...students.values()].map(student => ({
          session_id: id, student_id: student.id,
          expectation: resolveShachrisExpectation(config, progressHistory.find(entry => entry.student_id === student.id && applies(entry, date)), student.classId),
          stay_requirement: resolveShachrisStayRequirement(config, stayHistory.find(entry => entry.student_id === student.id && applies(entry, date)), student.age),
          presence: 'unmarked', arrival_at: null, last_return_at: null, leave_intervals: [],
          requirement_result: 'pending', requirement_met_at: null, requirement_met_milestone: null,
          said_section_ids: [], rating_id: '', note: '', revision: 0, updated_by_name: '',
          late_minutes: null, late_reason: null, late_reason_note: '', late_excused: false, absence_status: null,
          personally_cleared_at: null, personally_cleared_by_name: '', personally_cleared_milestone: null,
          extra_stay_intervals: [], stayed_beyond_required: false,
        }))
        sessions.set(id, { session, records })
      }
      const state = getSession(id)
      return copy({ session: state.session, records: state.records.filter(record => studentIds.includes(record.student_id)) })
    },
    async startShachrisSession(id, actorName) {
      const { session } = getSession(id)
      if (!session.started_at) {
        session.started_at = now()
        session.config.arrivalGraceMinutes = shachrisGraceMinutes(config)
        session.started_by_name = actorName
        session.milestone_times.hodu = session.started_at
        startAudit.set(id, [{ id: crypto.randomUUID(), action: 'started', previous_start: null, new_start: session.started_at, actor_name: actorName, reason: '', created_at: now() }, ...(startAudit.get(id) || [])])
      }
      return copy(session)
    },
    async bulkArriveAtShachrisStart(id, studentIds, actorName) {
      const { session } = requireStarted(id)
      return studentIds.map(studentId => {
        const record = getRecord(id, studentId)
        if (record.arrival_at || record.presence !== 'unmarked') return copy(record)
        record.presence = 'present'
        record.arrival_at = session.started_at
        record.late_minutes = 0
        return changed(record, actorName)
      })
    },
    async recordShachrisPresenceEvent(input) {
      const { session } = requireStarted(input.sessionId)
      const record = getRecord(input.sessionId, input.studentId)
      const at = now()
      if (input.eventType === 'arrival') {
        if (record.presence === 'left' || record.presence === 'present') throw new Error('Student is already present or must use Returned.')
        record.presence = 'present'
        record.absence_status = null
        record.arrival_at ||= at
        record.late_minutes = calculateShachrisMinutesLate(session.started_at, record.arrival_at, shachrisGraceMinutes(session.config))
        if (isShachrisLate(session.started_at, record.arrival_at, shachrisGraceMinutes(session.config))) record.late_reason ||= 'no_reason'
      } else if (input.eventType === 'left') {
        if (record.presence !== 'present' || !input.permission) throw new Error('Only a present student can leave; choose permission.')
        record.presence = 'left'
        record.leave_intervals.push({ leftAt: at, returnedAt: null, permission: input.permission })
        const extra = record.extra_stay_intervals?.at(-1)
        if (extra && !extra.endedAt) {
          extra.endedAt = at
          record.stayed_beyond_required ||= Date.parse(at) > Date.parse(extra.startedAt)
        }
      } else {
        const interval = latestOpenShachrisLeave(record.leave_intervals)
        if (record.presence !== 'left' || !interval) throw new Error('No open departure to return from.')
        interval.returnedAt = at
        record.last_return_at = at
        record.presence = 'present'
        if (record.personally_cleared_at) record.extra_stay_intervals!.push({ startedAt: at, endedAt: null })
      }
      return changed(record, input.actorName)
    },
    async markShachrisMilestone(id, milestoneId) {
      const state = requireStarted(id)
      if (state.session.milestone_times[milestoneId]) return copy({ ...state, metCount: 0, notMetCount: 0, alreadyMarked: true })
      const milestone = config.stayMilestones.find(entry => entry.id === milestoneId)
      const previous = config.stayMilestones.find(entry => entry.order === (milestone?.order ?? 0) - 1)
      if (!milestone || !previous || !state.session.milestone_times[previous.id]) throw new Error('Mark the previous milestone first.')
      const at = now()
      state.session.milestone_times[milestoneId] = at
      return copy({ ...state, metCount: 0, notMetCount: 0, alreadyMarked: false })
    },
    async saveShachrisRecords(id, incoming, actorName) {
      for (const entry of incoming) {
        if (getRecord(id, entry.student_id).revision !== entry.revision) throw new Error('Session changed. Reload and try again.')
        if (getRecord(id, entry.student_id).presence !== entry.presence) throw new Error('Use attendance actions to change presence.')
      }
      return incoming.map(entry => {
        const record = getRecord(id, entry.student_id)
        record.said_section_ids = [...entry.said_section_ids]
        record.rating_id = entry.rating_id
        record.note = entry.note
        return changed(record, actorName)
      })
    },
    async loadShachrisProgression(studentId) { return copy(progressHistory.filter(entry => entry.student_id === studentId)) },
    async loadShachrisStayHistory(studentId) { return copy(stayHistory.filter(entry => entry.student_id === studentId)) },
    async saveShachrisExpectation(input) {
      if (input.session.session_date !== localDateKey()) throw new Error('Changes are available for today only.')
      const record = getRecord(input.session.id, input.studentId)
      if (record.revision !== input.revision) throw new Error('Session changed. Reload and try again.')
      const assignment: ShachrisAssignment = {
        id: crypto.randomUUID(), student_id: input.studentId, mode: input.mode,
        milestone_id: input.mode === 'manual' ? input.milestoneId : null, section_ids: input.mode === 'manual' ? input.sectionIds : null,
        reason: input.reason.trim(), actor_name: input.actorName, effective_date: input.session.session_date, duration: input.duration, created_at: now(),
      }
      const expectation = resolveShachrisExpectation(config, assignment, students.get(input.studentId)?.classId)
      progressHistory.unshift(assignment)
      record.expectation = expectation
      return { assignment: copy(assignment), record: changed(record, input.actorName) }
    },
    async saveShachrisStayRequirement(input) {
      if (input.session.session_date !== localDateKey()) throw new Error('Changes are available for today only.')
      const record = getRecord(input.session.id, input.studentId)
      if (record.personally_cleared_at) throw new Error('A personally cleared requirement cannot be changed.')
      if (record.revision !== input.revision) throw new Error('Session changed. Reload and try again.')
      if (input.mode === 'manual' && !config.stayMilestones.some(entry => entry.id === input.requiredUntil && entry.order > 0)) throw new Error('Choose a valid stay milestone.')
      const assignment: ShachrisStayAssignment = {
        id: crypto.randomUUID(), student_id: input.studentId, mode: input.mode, required_until: input.mode === 'manual' ? input.requiredUntil : null,
        reason: input.reason.trim(), actor_name: input.actorName, effective_date: input.session.session_date, duration: input.duration, created_at: now(),
      }
      stayHistory.unshift(assignment)
      record.stay_requirement = resolveShachrisStayRequirement(config, assignment, students.get(input.studentId)?.age ?? null)
      record.requirement_result = 'pending'
      record.requirement_met_at = null
      record.requirement_met_milestone = null
      return { assignment: copy(assignment), record: changed(record, input.actorName) }
    },
    async saveShachrisLateReason(input) {
      const { session } = requireStarted(input.sessionId)
      const record = getRecord(input.sessionId, input.studentId)
      if (record.revision !== input.revision) throw new Error('Session changed. Reload and try again.')
      if (!isShachrisLate(session.started_at, record.arrival_at, shachrisGraceMinutes(session.config))) throw new Error('Student did not arrive late.')
      if (!['transportation', 'excused', 'no_reason', 'other'].includes(input.reason) || input.note.length > 500) throw new Error('Invalid late reason.')
      if (input.reason === 'no_reason' && input.excused) throw new Error('Choose Excused when excusing without a reason.')
      record.late_reason = input.reason
      record.late_excused = input.reason === 'excused' || input.excused
      record.late_reason_note = input.reason === 'other' ? input.note.trim() : ''
      return changed(record, input.actorName)
    },
    async setShachrisAbsence(input) {
      requireStarted(input.sessionId)
      const record = getRecord(input.sessionId, input.studentId)
      if (record.revision !== input.revision) throw new Error('Session changed. Reload and try again.')
      if (record.arrival_at || !['unmarked', 'absent'].includes(record.presence)) throw new Error('Record a departure for a student who has arrived.')
      if (!['unmarked', 'absent', 'excused', 'not_in_shul'].includes(input.status)) throw new Error('Invalid nonattendance status.')
      record.presence = input.status === 'unmarked' ? 'unmarked' : 'absent'
      record.absence_status = input.status === 'unmarked' ? null : input.status
      return changed(record, input.actorName)
    },
    async confirmShachrisClearance(input) {
      const { session } = requireStarted(input.sessionId)
      const record = getRecord(input.sessionId, input.studentId)
      if (record.revision !== input.revision) throw new Error('Session changed. Reload and try again.')
      if (record.personally_cleared_at) return copy(record)
      Object.assign(record, personallyClearShachrisRecord(record, session.milestone_times, now(), input.actorName))
      return changed(record, input.actorName)
    },
    async loadShachrisStartCorrectionState(id) {
      const state = getSession(id)
      return copy({ hasActivity: state.records.some(record => record.revision > 0) || Object.keys(state.session.milestone_times).some(key => key !== 'hodu'), audit: startAudit.get(id) || [] })
    },
    async correctShachrisStart(input) {
      const state = requireStarted(input.sessionId)
      if (state.session.session_date !== localDateKey() || state.session.started_at !== input.expectedStart) throw new Error('Hodu start changed or is not today. Reload before correcting.')
      if (!input.confirmed || !input.reason.trim() || input.reason.length > 500) throw new Error('Confirm the correction and provide a reason.')
      const previous = state.session.started_at
      if (input.mode === 'reset') {
        if (state.records.some(record => record.revision > 0) || Object.keys(state.session.milestone_times).some(key => key !== 'hodu')) throw new Error('Attendance or milestone activity exists. Correct the start time instead.')
        state.session.started_at = null
        state.session.started_by_name = ''
        delete state.session.milestone_times.hodu
      } else {
        if (!input.newStart || !Number.isFinite(Date.parse(input.newStart)) || localDateKey(new Date(input.newStart)) !== localDateKey() || Date.parse(input.newStart) > Date.now()) throw new Error('Choose a valid start time today, not in the future.')
        if (Object.entries(state.session.milestone_times).some(([milestone, at]) => milestone !== 'hodu' && Date.parse(input.newStart!) > Date.parse(at))) throw new Error('Start time cannot be after a recorded communal milestone.')
        state.session.started_at = input.newStart
        state.session.milestone_times.hodu = input.newStart
        state.session.config.arrivalGraceMinutes = shachrisGraceMinutes(config)
        for (const record of state.records.filter(entry => entry.arrival_at)) {
          record.late_minutes = calculateShachrisMinutesLate(input.newStart, record.arrival_at, shachrisGraceMinutes(state.session.config))
          changed(record, input.actorName)
        }
      }
      startAudit.set(input.sessionId, [{ id: crypto.randomUUID(), action: input.mode === 'reset' ? 'reset' : 'corrected', previous_start: previous, new_start: state.session.started_at, actor_name: input.actorName, reason: input.reason.trim(), created_at: now() }, ...(startAudit.get(input.sessionId) || [])])
      return copy(state)
    },
  }
}