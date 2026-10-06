import type { ShachrisBackend } from '../../../src/services/shachrisBackend'
import type { ShachrisSession } from '../../../src/services/shachrisService'
import { evaluateShachrisRequirementAtMilestone, INITIAL_SHACHRIS_CONFIG, latestOpenShachrisLeave, localDateKey, resolveShachrisExpectation, resolveShachrisStayRequirement, type ShachrisAssignment, type ShachrisConfig, type ShachrisRecord, type ShachrisStayAssignment } from '../../../src/utils/shachris'
import type { DemoStudent } from './roster'

export function createShachrisDemoBackend(roster: DemoStudent[], initialConfig: ShachrisConfig = INITIAL_SHACHRIS_CONFIG): ShachrisBackend {
  const config = structuredClone(initialConfig)
  const students = new Map(roster.map(student => [student.id, { id: student.id, age: student.age, classId: student.classId }]))
  const sessions = new Map<string, { session: ShachrisSession; records: ShachrisRecord[] }>()
  const progressHistory: ShachrisAssignment[] = []
  const stayHistory: ShachrisStayAssignment[] = []
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
    async loadAccess() { return { canEdit: true, canManage: false } },
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
        session.started_by_name = actorName
        session.milestone_times.hodu = session.started_at
      }
      return copy(session)
    },
    async bulkArriveAtShachrisStart(id, studentIds, actorName) {
      const { session } = requireStarted(id)
      return studentIds.map(studentId => {
        const record = getRecord(id, studentId)
        if (record.arrival_at || record.presence === 'left') return copy(record)
        record.presence = 'present'
        record.arrival_at = session.started_at
        return changed(record, actorName)
      })
    },
    async recordShachrisPresenceEvent(input) {
      requireStarted(input.sessionId)
      const record = getRecord(input.sessionId, input.studentId)
      const at = now()
      if (input.eventType === 'arrival') {
        if (record.presence === 'left') throw new Error('Use Returned for a student who is out.')
        record.presence = 'present'
        record.arrival_at ||= at
      } else if (input.eventType === 'left') {
        if (record.presence !== 'present' || !input.permission) throw new Error('Only a present student can leave; choose permission.')
        record.presence = 'left'
        record.leave_intervals.push({ leftAt: at, returnedAt: null, permission: input.permission })
      } else {
        const interval = latestOpenShachrisLeave(record.leave_intervals)
        if (record.presence !== 'left' || !interval) throw new Error('No open departure to return from.')
        interval.returnedAt = at
        record.last_return_at = at
        record.presence = 'present'
      }
      return changed(record, input.actorName)
    },
    async markShachrisMilestone(id, milestoneId, actorName) {
      const state = requireStarted(id)
      if (state.session.milestone_times[milestoneId]) return copy({ ...state, metCount: 0, notMetCount: 0, alreadyMarked: true })
      const milestone = config.stayMilestones.find(entry => entry.id === milestoneId)
      const previous = config.stayMilestones.find(entry => entry.order === (milestone?.order ?? 0) - 1)
      if (!milestone || !previous || !state.session.milestone_times[previous.id]) throw new Error('Mark the previous milestone first.')
      const at = now()
      state.session.milestone_times[milestoneId] = at
      let metCount = 0
      let notMetCount = 0
      state.records = state.records.map(record => {
        const evaluated = evaluateShachrisRequirementAtMilestone(record, milestoneId, at)
        if (evaluated === record) return record
        if (evaluated.requirement_result === 'met') metCount++
        else notMetCount++
        changed(evaluated, actorName)
        return evaluated
      })
      return copy({ ...state, metCount, notMetCount, alreadyMarked: false })
    },
    async saveShachrisRecords(id, incoming, actorName) {
      for (const entry of incoming) {
        if (getRecord(id, entry.student_id).revision !== entry.revision) throw new Error('Session changed. Reload and try again.')
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
  }
}